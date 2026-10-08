/**
 * Public Routes (Read-only catalog for future Sprint 3 storefront)
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const express = require('express');
const router = express.Router();
const CategoryModel = require('../models/categoryModel');
const ProductModel = require('../models/productModel');
const { buildTree } = require('../utils/categoryTree');

// Public Category Tree
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await CategoryModel.findAll({ activeOnly: true });
    const tree = buildTree(categories);
    res.status(200).json({
      success: true,
      count: tree.length,
      data: { categories: tree }
    });
  } catch (err) {
    next(err);
  }
});

// Public Published Products
router.get('/products', async (req, res, next) => {
  try {
    const { category_id, limit, offset } = req.query;
    const products = await ProductModel.findAll({
      status: 'published',
      category_id: category_id ? parseInt(category_id, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.status(200).json({
      success: true,
      count: products.length,
      data: { products }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
