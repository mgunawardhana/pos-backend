const express = require('express');
const router = express.Router();
const {
  createSales,
  fetchOrders,
  fetchChartData,
  getDailyTotals,
  updateSalesByGroupCode, getAllEarningsByDateRange, reducePriceByOrderCode,
} = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes requiring authentication
router.post('/', authMiddleware, createSales);
router.get('/orders', authMiddleware, fetchOrders);
router.get('/chart-data', authMiddleware, fetchChartData);
router.get('/daily-totals', authMiddleware, getDailyTotals);
router.put('/update-by-group/:groupCode', updateSalesByGroupCode);
router.get('/earnings/date-range', getAllEarningsByDateRange);
router.put('/reduce-price/:groupCode', authMiddleware, reducePriceByOrderCode);

module.exports = router;
