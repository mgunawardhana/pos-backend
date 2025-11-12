const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes requiring authentication
router.get('/page/:page/size/:size', authMiddleware, productController.getAllProducts);
router.post('/', authMiddleware, productController.createProduct);
router.get('/:id', authMiddleware, productController.getProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;