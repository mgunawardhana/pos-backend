const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require("../middleware/authMiddleware");


// Protected routes requiring authentication
router.get('/page/:page/size/:size', authMiddleware, categoryController.getCategories);
router.post('/', authMiddleware, categoryController.createCategory);
router.get('/:id', authMiddleware, categoryController.getCategoryById);
router.put('/:id', authMiddleware, categoryController.updateCategory);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;