/**
 * Category Administration Controller
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const CategoryModel = require('../models/categoryModel');
const { buildTree, detectCycle } = require('../utils/categoryTree');
const { query } = require('../config/database');

class CategoryController {
  /**
   * POST /api/v1/admin/categories
   * Create a new category. Enforces CAT-01: unique slug, optional parent, cycle prevention.
   */
  static async createCategory(req, res, next) {
    try {
      const { name, slug, description, parent_id, is_active = true } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          error: 'ValidationFailed',
          message: 'Both category name and slug are required.'
        });
      }

      // Check slug uniqueness before hitting DB
      const existingSlug = await CategoryModel.findBySlug(slug);
      if (existingSlug) {
        return res.status(409).json({
          success: false,
          error: 'ConflictDuplicateResource',
          message: `Category slug '${slug}' is already taken within the catalog.`
        });
      }

      // Validate parent_id if supplied
      if (parent_id) {
        const parent = await CategoryModel.findById(parent_id);
        if (!parent) {
          return res.status(400).json({
            success: false,
            error: 'ValidationError',
            message: `Parent category with ID ${parent_id} does not exist.`
          });
        }
      }

      const category = await CategoryModel.create({
        name,
        slug,
        description,
        parent_id: parent_id ? parseInt(parent_id, 10) : null,
        is_active: Boolean(is_active)
      });

      return res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        data: { category }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/categories
   * Returns the hierarchical category tree.
   */
  static async getCategories(req, res, next) {
    try {
      const format = req.query.format || 'tree';
      const activeOnly = req.query.active_only === 'true';

      const categories = await CategoryModel.findAll({ activeOnly });

      if (format === 'flat') {
        return res.status(200).json({
          success: true,
          count: categories.length,
          data: { categories }
        });
      }

      const tree = buildTree(categories);
      return res.status(200).json({
        success: true,
        count: tree.length,
        data: { categories: tree }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/categories/:id
   */
  static async getCategoryById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await CategoryModel.findById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'ResourceNotFound',
          message: `Category with ID ${id} not found.`
        });
      }

      return res.status(200).json({
        success: true,
        data: { category }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/categories/:id
   * Update category fields, parent relationship, or active status.
   * Enforces CAT-01: Cycle detection when updating parent_id.
   */
  static async updateCategory(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await CategoryModel.findById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'ResourceNotFound',
          message: `Category with ID ${id} not found.`
        });
      }

      const { name, slug, description, parent_id, is_active } = req.body;

      // Slug uniqueness check if changed
      if (slug && slug.toLowerCase() !== category.slug.toLowerCase()) {
        const existingSlug = await CategoryModel.findBySlug(slug);
        if (existingSlug && existingSlug.id !== id) {
          return res.status(409).json({
            success: false,
            error: 'ConflictDuplicateResource',
            message: `Category slug '${slug}' is already taken.`
          });
        }
      }

      // Hierarchy cycle check if parent_id is being modified
      if (parent_id !== undefined && parent_id !== null) {
        const parsedParentId = parseInt(parent_id, 10);
        const cycleResult = await detectCycle(id, parsedParentId, query);
        if (cycleResult.hasCycle) {
          return res.status(400).json({
            success: false,
            error: 'HierarchyCycleDetected',
            message: cycleResult.reason || 'Category hierarchy cycle detected: A category cannot become its own ancestor.'
          });
        }
      }

      const updated = await CategoryModel.update(id, {
        name,
        slug,
        description,
        parent_id: parent_id !== undefined ? (parent_id ? parseInt(parent_id, 10) : null) : undefined,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined
      });

      return res.status(200).json({
        success: true,
        message: 'Category updated successfully.',
        data: { category: updated }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CategoryController;
