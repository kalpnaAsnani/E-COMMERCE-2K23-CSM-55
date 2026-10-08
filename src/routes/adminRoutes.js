/**
 * Administrative Routes (Sprint 2 Catalog Administration)
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const ProductController = require('../controllers/productController');
const SkuController = require('../controllers/skuController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All administrative routes require valid JWT authentication AND 'admin' role
router.use(authenticateToken);
router.use(requireAdmin);

// Category Management Endpoints (CAT-01)
router.post('/categories', CategoryController.createCategory);
router.get('/categories', CategoryController.getCategories);
router.get('/categories/:id', CategoryController.getCategoryById);
router.patch('/categories/:id', CategoryController.updateCategory);

// Product Management Endpoints (CAT-02, CAT-03)
router.post('/products', ProductController.createProduct);
router.get('/products', ProductController.getProducts);
router.get('/products/:id', ProductController.getProductById);
router.patch('/products/:id', ProductController.updateProduct);

// Variant Dimensions (CAT-03, CAT-04)
router.post('/products/:id/variants', ProductController.addVariant);

// SKU & Inventory Management Endpoints (CAT-03, CAT-04, CAT-05)
router.post('/products/:id/skus', SkuController.addSku);
router.patch('/skus/:id', SkuController.updateSku);
router.get('/skus/:id', SkuController.getSkuById);

module.exports = router;
