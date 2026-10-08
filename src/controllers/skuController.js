/**
 * SKU Administration Controller
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const SkuModel = require('../models/skuModel');
const ProductModel = require('../models/productModel');
const { validateSkuAttributes, validatePriceAndStock } = require('../utils/variantValidator');

class SkuController {
  /**
   * POST /api/v1/admin/products/:id/skus
   * Add a validated SKU to a product.
   * Enforces CAT-03, CAT-04, CAT-05.
   */
  static async addSku(req, res, next) {
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

      if (product.status === 'archived') {
        return res.status(400).json({
          success: false,
          error: 'InvalidProductState',
          message: 'Cannot add SKUs to an archived product.'
        });
      }

      const { sku_code, attributes = {}, price, stock_quantity = 0, is_active = true } = req.body;

      if (!sku_code || price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'ValidationFailed',
          message: 'sku_code and price are mandatory fields.'
        });
      }

      // Check SKU code uniqueness
      const existingSkuCode = await SkuModel.findByCode(sku_code);
      if (existingSkuCode) {
        return res.status(409).json({
          success: false,
          error: 'ConflictDuplicateResource',
          message: `SKU code '${sku_code}' is already assigned to another item.`
        });
      }

      // Fetch defined variants and existing SKUs for this product
      const [definedVariants, existingSkus] = await Promise.all([
        ProductModel.getVariants(productId),
        ProductModel.getSkus(productId)
      ]);

      // CAT-04: Validate variant attribute combination against declared dimensions
      const attrValidation = validateSkuAttributes(definedVariants, attributes, existingSkus);
      if (!attrValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'InvalidVariantCombination',
          message: 'The submitted attribute combination is invalid.',
          details: attrValidation.errors
        });
      }

      // Validate numeric price and stock
      const numericValidation = validatePriceAndStock(price, stock_quantity);
      if (!numericValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ValidationFailed',
          message: 'Numeric validation failed.',
          details: numericValidation.errors
        });
      }

      const newSku = await SkuModel.create({
        product_id: productId,
        sku_code,
        attributes,
        price: numericValidation.sanitizedPrice,
        stock_quantity: numericValidation.sanitizedStock,
        is_active: Boolean(is_active)
      });

      return res.status(201).json({
        success: true,
        message: 'Sellable SKU registered successfully.',
        data: { sku: newSku }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/skus/:id
   * Update price, stock, or active status.
   */
  static async updateSku(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const sku = await SkuModel.findById(id);

      if (!sku) {
        return res.status(404).json({
          success: false,
          error: 'ResourceNotFound',
          message: `SKU with ID ${id} not found.`
        });
      }

      const { price, stock_quantity, is_active, sku_code } = req.body;

      // Validate price if provided
      if (price !== undefined) {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({
            success: false,
            error: 'ValidationFailed',
            message: 'Price must be a valid non-negative number.'
          });
        }
      }

      // Validate stock_quantity if provided
      if (stock_quantity !== undefined) {
        const parsedStock = parseInt(stock_quantity, 10);
        if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(Number(stock_quantity))) {
          return res.status(400).json({
            success: false,
            error: 'ValidationFailed',
            message: 'Stock quantity must be a non-negative integer.'
          });
        }
      }

      // Check unique sku_code if modified
      if (sku_code && sku_code.toUpperCase() !== sku.sku_code.toUpperCase()) {
        const existing = await SkuModel.findByCode(sku_code);
        if (existing && existing.id !== id) {
          return res.status(409).json({
            success: false,
            error: 'ConflictDuplicateResource',
            message: `SKU code '${sku_code}' is already in use.`
          });
        }
      }

      const updated = await SkuModel.update(id, {
        price,
        stock_quantity,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined,
        sku_code
      });

      return res.status(200).json({
        success: true,
        message: 'SKU updated successfully.',
        data: { sku: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/skus/:id
   */
  static async getSkuById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const sku = await SkuModel.findById(id);

      if (!sku) {
        return res.status(404).json({
          success: false,
          error: 'ResourceNotFound',
          message: `SKU with ID ${id} not found.`
        });
      }

      return res.status(200).json({
        success: true,
        data: { sku }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SkuController;
