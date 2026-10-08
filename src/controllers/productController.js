/**
 * Product Administration Controller
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');

class ProductController {
  /**
   * POST /api/v1/admin/products
   * Create a draft product. Enforces CAT-02.
   */
  static async createProduct(req, res, next) {
    try {
      const { category_id, name, slug, description, status = 'draft', specifications = {} } = req.body;

      if (!category_id || !name || !slug) {
        return res.status(400).json({
          success: false,
          error: 'ValidationFailed',
          message: 'category_id, name, and slug are required fields.'
        });
      }

      // Check category exists
      const category = await CategoryModel.findById(category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'ForeignKeyViolation',
          message: `Category with ID ${category_id} does not exist.`
        });
      }

      // Check slug uniqueness
      const existingSlug = await ProductModel.findBySlug(slug);
      if (existingSlug) {
        return res.status(409).json({
          success: false,
          error: 'ConflictDuplicateResource',
          message: `Product slug '${slug}' is already in use within the catalog.`
        });
      }

      // Validate status
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'ValidationFailed',
          message: `Status must be one of: ${validStatuses.join(', ')}.`
        });
      }

      // Business Rule: Cannot create a newly published product without SKUs
      if (status === 'published') {
        return res.status(400).json({
          success: false,
          error: 'InvalidLifecycleTransition',
          message: 'A product cannot be created directly as published. Create as draft, register sellable SKUs, then publish.'
        });
      }

      const product = await ProductModel.create({
        category_id: parseInt(category_id, 10),
        name,
        slug,
        description,
        status,
        specifications
      });

      return res.status(201).json({
        success: true,
        message: 'Product draft created successfully.',
        data: { product }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/products
   * Return administrative product records with inventory aggregates.
   */
  static async getProducts(req, res, next) {
    try {
      const { status, category_id, limit, offset } = req.query;
      const products = await ProductModel.findAll({
        status,
        category_id: category_id ? parseInt(category_id, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0
      });

      return res.status(200).json({
        success: true,
        count: products.length,
        data: { products }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/products/:id
   * Return full product details including variants, SKUs, and assets.
   */
  static async getProductById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'ResourceNotFound',
          message: `Product with ID ${id} not found.`
        });
      }

      const [variants, skus, assets] = await Promise.all([
        ProductModel.getVariants(id),
        ProductModel.getSkus(id),
        ProductModel.getAssets(id)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          product: {
            ...product,
            variants,
            skus,
            assets
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/products/:id
   * Update product content or status.
   * Enforces Business Rule 1: A published product must have at least one sellable SKU.
   */
  static async updateProduct(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'ResourceNotFound',
          message: `Product with ID ${id} not found.`
        });
      }

      const { name, slug, description, category_id, status, specifications } = req.body;

      // Check slug uniqueness if changed
      if (slug && slug.toLowerCase() !== product.slug.toLowerCase()) {
        const existingSlug = await ProductModel.findBySlug(slug);
        if (existingSlug && existingSlug.id !== id) {
          return res.status(409).json({
            success: false,
            error: 'ConflictDuplicateResource',
            message: `Product slug '${slug}' is already taken.`
          });
        }
      }

      // Check category if changed
      if (category_id && category_id !== product.category_id) {
        const category = await CategoryModel.findById(category_id);
        if (!category) {
          return res.status(400).json({
            success: false,
            error: 'ForeignKeyViolation',
            message: `Target category with ID ${category_id} does not exist.`
          });
        }
      }

      // Enforce Business Rule 1 on publication
      if (status === 'published') {
        const skus = await ProductModel.getSkus(id);
        const activeSkus = skus.filter(s => s.is_active && s.stock_quantity >= 0);
        if (activeSkus.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'InvalidPublicationState',
            message: 'A published product must have at least one sellable active SKU. Add a valid SKU before publishing.'
          });
        }
      }

      const updated = await ProductModel.update(id, {
        name,
        slug,
        description,
        category_id: category_id ? parseInt(category_id, 10) : undefined,
        status,
        specifications
      });

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully.',
        data: { product: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/products/:id/variants
   * Define a variant dimension (e.g. Glaze Finish, Vessel Size) on a product.
   */
  static async addVariant(req, res, next) {
    try {
      const productId = parseInt(req.params.id, 10);
      const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'ResourceNotFound',
          message: `Product with ID ${productId} not found.`
        });
      }

      const { name, options } = req.body;

      if (!name || !options || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'ValidationFailed',
          message: 'Variant name and a non-empty array of options are required.'
        });
      }

      const variant = await ProductModel.addVariant(productId, {
        name: name.trim(),
        options: options.map(o => String(o).trim())
      });

      return res.status(201).json({
        success: true,
        message: 'Variant dimension added successfully.',
        data: { variant }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProductController;
