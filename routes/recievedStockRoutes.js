const express = require('express');
const router = express.Router();
const receivedStockController = require('../controllers/recievedStockController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes requiring authentication
router.get('/page/:page/size/:size', authMiddleware, receivedStockController.getAllReceivedStocks);
router.post('/', authMiddleware, receivedStockController.createReceivedStock);
router.get('/:id', authMiddleware, receivedStockController.getReceivedStock);
router.put('/:id', authMiddleware, receivedStockController.updateReceivedStock);
router.delete('/:id', authMiddleware, receivedStockController.deleteReceivedStock);

module.exports = router;