const Sales = require('../models/Sales');
// Create a new sales record
const Product = require('../models/Product');

const createSales = async (req, res) => {
  try {
    const {
      groupCode,
      orderCode,
      selectedProducts,
      company,
      discount,
      guide,
      categoryCode,
      forBoatman,
      gift,
      Price,
      itemWiseTotal,
      exotic,
      less,
      demonstratorName, // Added this field
    } = req.body;

    // Validate required fields and perform basic validations
    if (!groupCode || !orderCode || !selectedProducts || !Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate demonstratorName is provided
    if (!demonstratorName || demonstratorName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Demonstrator name is required'
      });
    }

    // Fetch and validate products, check stock
    for (let i = 0; i < selectedProducts.length; i++) {
      const { productId, quantity } = selectedProducts[i];

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found for ID: ${productId}`
        });
      }

      if (product.stocks < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.itemName}. Available: ${product.stocks}, Requested: ${quantity}`
        });
      }

      // Update selectedProducts with product details
      selectedProducts[i] = {
        productId,
        productName: product.itemName,
        quantity
      };

      // Update product stock
      try {
        await Product.findByIdAndUpdate(
          productId,
          { $inc: { stocks: -quantity } },
          { new: true }
        );
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Failed to update stock for product ${product.itemName}`
        });
      }
    }

    // Build the order object
    const order = {
      orderCode,
      guide: {
        name: guide.name,
        percentage: guide.percentage,
        amount: guide.amount,
      },
      company: {
        percentage: company.percentage,
        amount: company.amount,
      },
      discount: {
        percentage: discount.percentage,
        amount: discount.amount,
      },
      selectedProducts,
      forBoatman: forBoatman || [],
      gift,
      Price,
      itemWiseTotal,
      categoryCode,
      exotic,
      less,
      demonstratorName, // Added this field to the order object
    };

    const salesData = {
      groupCode,
      orders: [order],
    };

    // Save the sales record
    const sales = new Sales(salesData);
    const savedSales = await sales.save();

    res.status(201).json({
      success: true,
      message: 'Sales record created successfully and stocks updated',
      data: savedSales,
    });

  } catch (error) {
    console.error('Error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating sales record',
      error: error.message
    });
  }
};

const fetchOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.size) || 10;
    const { startDate, endDate, groupCode, boatmanName } = req.query;

    // Only consider non-empty filters
    const hasFilters =
      (startDate && startDate.trim() !== '') ||
      (endDate && endDate.trim() !== '') ||
      (groupCode && groupCode.trim() !== '') ||
      (boatmanName && boatmanName.trim() !== '');

    if (!hasFilters) {
      if (page < 1) {
        return res.status(400).json({
          success: false,
          message: 'Page number must be greater than 0',
        });
      }
      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100',
        });
      }
    }

    const matchStage = {};

    // Date range filter (on createdAt)
    if ((startDate && startDate.trim() !== '') || (endDate && endDate.trim() !== '')) {
      matchStage.createdAt = {};
      if (startDate && startDate.trim() !== '') {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate && endDate.trim() !== '') {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        matchStage.createdAt.$lt = end;
      }
    }

    if (groupCode && groupCode.trim() !== '') {
      matchStage.groupCode = { $regex: groupCode, $options: 'i' };
    }

    // Build pipeline
    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    pipeline.push(
      { $unwind: '$orders' },
      // Boatman filter (inside orders)
      ...(boatmanName && boatmanName.trim() !== ''
        ? [{ $match: { 'orders.forBoatman.boatmanName': { $regex: boatmanName, $options: 'i' } } }]
        : []),
      {
        $group: {
          _id: '$groupCode',
          orderCount: { $sum: 1 },
          orders: { $push: '$orders' },
          createdAt: { $first: '$createdAt' }
        }
      },
      {
        $project: {
          _id: 0,
          groupCode: '$_id',
          orderCount: 1,
          orders: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    );

    // Add pagination if no filters
    const ordersPipeline = hasFilters
      ? pipeline
      : [
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];

    let totalOrders = 0;
    let totalPages = 0;
    if (!hasFilters) {
      const totalCountPipeline = [];
      if (Object.keys(matchStage).length > 0) {
        totalCountPipeline.push({ $match: matchStage });
      }
      totalCountPipeline.push(
        { $unwind: '$orders' },
        { $group: { _id: '$groupCode' } },
        { $count: 'total' }
      );

      const countResult = await Sales.aggregate(totalCountPipeline);
      totalOrders = countResult.length > 0 ? countResult[0].total : 0;
      totalPages = Math.ceil(totalOrders / limit);
    }

    const groups = await Sales.aggregate(ordersPipeline);

    // Flatten orders for each group, mapping required fields - including guide.name and demonstratorName
    const transformedOrders = groups.map(group => ({
      groupCode: group.groupCode,
      orderCount: group.orderCount,
      orders: group.orders.map(order => ({
        orderCode: order.orderCode,
        selectedProducts: order.selectedProducts.map(product => ({
          productId: product.productId ? product.productId.toString() : null,
          productName: product.productName,
          quantity: product.quantity
        })),
        guide: {
          name: order.guide?.name,
          percentage: order.guide?.percentage,
          amount: order.guide?.amount
        },
        forBoatman: order.forBoatman.map(boatman => ({
          name: boatman.boatmanName,
          percentage: boatman.percentage,
          costAmount: boatman.costAmount
        })),
        price: order.Price,
        company: {
          percentage: order.company?.percentage,
          amount: order.company?.amount
        },
        discount: {
          percentage: order.discount?.percentage,
          amount: order.discount?.amount
        },
        gift: order.gift,
        itemWiseTotal: order.itemWiseTotal,
        categoryCode: order.categoryCode,
        exotic: order.exotic,
        less: order.less,
        demonstratorName: order.demonstratorName // Added this field to the response
      })),
      date: group.createdAt ? group.createdAt.toISOString().split('T')[0] : null,
      time: group.createdAt ? group.createdAt.toTimeString().split(' ')[0] : null
    }));

    const response = {
      success: true,
      message: 'Orders fetched successfully',
      data: transformedOrders,
    };

    if (!hasFilters) {
      response.pagination = {
        currentPage: page,
        totalPages: totalPages,
        totalOrders: totalOrders,
        ordersPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      };
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message,
    });
  }
};

const fetchChartData = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Aggregation pipeline to group by month for current year
    const pipeline = [
      // Match documents for current year
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
          }
        }
      },
      // Unwind orders array
      { $unwind: '$orders' },
      // Group by month
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalIncome: { $sum: '$orders.Price' },
          orderCount: { $sum: 1 }
        }
      },
      // Project to format output
      {
        $project: {
          _id: 0,
          month: '$_id',
          totalIncome: 1,
          orderCount: 1
        }
      },
      // Sort by month
      { $sort: { month: 1 } }
    ];

    const results = await Sales.aggregate(pipeline);

    // Create array of all months (1-12) with default values
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalIncome: 0,
      orderCount: 0
    }));

    // Merge actual data with all months
    results.forEach(data => {
      months[data.month - 1] = {
        month: data.month,
        totalIncome: data.totalIncome,
        orderCount: data.orderCount
      };
    });

    // Define month names for labels
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Structure data for Chart.js
    const chartData = {
      labels: monthNames,
      datasets: [
        {
          label: 'Total Income (LKR)',
          data: months.map(m => m.totalIncome),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Order Count',
          data: months.map(m => m.orderCount),
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y1',
          tension: 0.1,
          fill: false
        }
      ]
    };

    res.status(200).json({
      success: true,
      message: 'Chart data fetched successfully',
      data: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chart data',
      error: error.message
    });
  }
};

const getDailyTotals = async (req, res) => {
  try {
    // Get current date at midnight (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow at midnight (end of day)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyTotals = await Sales.aggregate([
      // Match records for current date
      {
        $match: {
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      // Unwind orders array to calculate order-level metrics
      { $unwind: '$orders' },
      // Group and calculate totals
      {
        $group: {
          _id: null,
          uniqueGroupCodes: { $addToSet: '$groupCode' }, // Count unique group codes
          orderCount: { $sum: 1 }, // Count total orders
          // Sum all boatman costs
          totalBoatmanCost: {
            $sum: {
              $reduce: {
                input: '$orders.forBoatman',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.costAmount'] }
              }
            }
          },
          // Sum all guide costs
          totalGuideCost: {
            $sum: '$orders.guide.amount'
          },
          // Calculate total sales amount
          totalSalesAmount: {
            $sum: '$orders.Price'
          }
        }
      },
      // Format the output
      {
        $project: {
          _id: 0,
          groupCodeCount: { $size: '$uniqueGroupCodes' },
          orderCount: 1,
          totalBoatmanCost: 1,
          totalGuideCost: 1,
          totalSalesAmount: 1
        }
      }
    ]);

    // If no data found for today, return zeros
    const defaultResponse = {
      groupCodeCount: 0,
      orderCount: 0,
      totalBoatmanCost: 0,
      totalGuideCost: 0,
      totalSalesAmount: 0
    };

    const result = dailyTotals.length > 0 ? dailyTotals[0] : defaultResponse;

    return res.status(200).json({
      success: true,
      message: 'Daily totals retrieved successfully',
      data: {
        ...result,
        date: today.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error in getDailyTotals:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching daily totals',
      error: error.message
    });
  }
};

const updateSalesByGroupCode = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const {
      customDiscountPercentage,
      calculatedDiscountAmount,
      customBoatmanPercentage,
      customCompanyPercentage,
      calculatedCompanyAmount,
      customGuidePercentage,
      lessFromBoatman,
      lessFromGuide,
      giftFromBoatman,
      giftFromGuide
    } = req.body;

    // Find ALL sales documents with the same groupCode
    const salesDocs = await Sales.find({ groupCode });

    if (!salesDocs || salesDocs.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sales record not found with group code: ${groupCode}`
      });
    }

    let totalGuideAmount = 0;
    let totalBoatmanAmount = 0;

    // Calculate totals for proportional distribution
    const totalLessDeduction = (lessFromGuide || 0) + (lessFromBoatman || 0);
    const totalGiftDeduction = (giftFromGuide || 0) + (giftFromBoatman || 0);

    // Get current totals from ALL orders across ALL documents with same groupCode
    let currentTotalLess = 0;
    let currentTotalGift = 0;
    let allOrders = [];

    // Collect all orders from all documents with the same groupCode
    salesDocs.forEach((doc) => {
      doc.orders.forEach((order) => {
        currentTotalLess += order.less || 0;
        currentTotalGift += order.gift || 0;
        allOrders.push({
          order: order,
          docId: doc._id,
          originalLess: order.less || 0,
          originalGift: order.gift || 0
        });
      });
    });

    // Calculate remaining amounts after deductions
    const remainingTotalLess = Math.max(0, currentTotalLess - totalLessDeduction);
    const remainingTotalGift = Math.max(0, currentTotalGift - totalGiftDeduction);

    // Process each order
    allOrders.forEach((orderInfo, index) => {
      const order = orderInfo.order;

      // Use order.Price as the base for all percentage calculations
      const calculationBase = order.Price || 0;

      // 1. Calculate discount based on the price
      if (customDiscountPercentage !== undefined) {
        order.discount.percentage = customDiscountPercentage;
        order.discount.amount = (calculationBase * customDiscountPercentage) / 100;
      } else if (calculatedDiscountAmount !== undefined) {
        order.discount.amount = calculatedDiscountAmount;
      }

      // 2. Calculate company amount based on the price
      let companyAmount = (calculationBase * (customCompanyPercentage ?? order.company.percentage)) / 100;
      if (calculatedCompanyAmount !== undefined) {
        companyAmount = calculatedCompanyAmount;
      }
      order.company.amount = companyAmount;
      if (customCompanyPercentage !== undefined) {
        order.company.percentage = customCompanyPercentage;
      }

      // 3. Calculate guide amount based on the price and apply deductions
      let guideAmount = (calculationBase * (customGuidePercentage ?? order.guide.percentage)) / 100;

      if (lessFromGuide !== undefined && lessFromGuide > 0) {
        guideAmount = Math.max(0, guideAmount - lessFromGuide);
      }

      if (giftFromGuide !== undefined && giftFromGuide > 0) {
        guideAmount = Math.max(0, guideAmount - giftFromGuide);
      }

      order.guide.amount = guideAmount;
      if (customGuidePercentage !== undefined) {
        order.guide.percentage = customGuidePercentage;
      }
      totalGuideAmount += guideAmount;

      // 4. Calculate boatman amount based on the price and apply deductions
      let boatmanAmount = (calculationBase * (customBoatmanPercentage ?? order.forBoatman[0]?.percentage)) / 100;

      if (lessFromBoatman !== undefined && lessFromBoatman > 0) {
        boatmanAmount = Math.max(0, boatmanAmount - lessFromBoatman);
      }

      if (giftFromBoatman !== undefined && giftFromBoatman > 0) {
        boatmanAmount = Math.max(0, boatmanAmount - giftFromBoatman);
      }

      order.forBoatman.forEach((boatman) => {
        boatman.costAmount = boatmanAmount;
        if (customBoatmanPercentage !== undefined) {
          boatman.percentage = customBoatmanPercentage;
        }
      });

      const currentTotalBoatmanPayout = boatmanAmount * order.forBoatman.length;
      totalBoatmanAmount += currentTotalBoatmanPayout;

      // 5. Distribute remaining less amount proportionally
      if (currentTotalLess > 0) {
        const orderLessRatio = orderInfo.originalLess / currentTotalLess;
        order.less = Math.round(remainingTotalLess * orderLessRatio);
      } else {
        order.less = 0;
      }

      // 6. Distribute remaining gift amount proportionally
      if (currentTotalGift > 0) {
        const orderGiftRatio = orderInfo.originalGift / currentTotalGift;
        order.gift = Math.round(remainingTotalGift * orderGiftRatio);
      } else {
        order.gift = 0;
      }
    });

    // Handle any rounding discrepancies for the last order
    if (allOrders.length > 0) {
      // Calculate actual totals after distribution
      let actualTotalLess = 0;
      let actualTotalGift = 0;

      allOrders.forEach((orderInfo) => {
        actualTotalLess += orderInfo.order.less || 0;
        actualTotalGift += orderInfo.order.gift || 0;
      });

      // Adjust the last order for any rounding differences
      const lastOrder = allOrders[allOrders.length - 1].order;

      const lessDifference = remainingTotalLess - actualTotalLess;
      if (lessDifference !== 0) {
        lastOrder.less += lessDifference;
      }

      const giftDifference = remainingTotalGift - actualTotalGift;
      if (giftDifference !== 0) {
        lastOrder.gift += giftDifference;
      }
    }

    // Save all updated documents
    const updatedSalesDocs = [];
    for (const doc of salesDocs) {
      // Mark orders as modified
      doc.orders.forEach((order) => {
        doc.markModified('orders');
      });

      const updatedDoc = await doc.save();
      updatedSalesDocs.push(updatedDoc);
    }

    // Calculate final totals for response
    let finalTotalLess = 0;
    let finalTotalGift = 0;

    updatedSalesDocs.forEach((doc) => {
      doc.orders.forEach((order) => {
        finalTotalLess += order.less || 0;
        finalTotalGift += order.gift || 0;
      });
    });

    res.status(200).json({
      success: true,
      message: 'Sales records updated successfully.',
      data: updatedSalesDocs,
      calculationDetails: {
        lessFromGuide: lessFromGuide || 0,
        lessFromBoatman: lessFromBoatman || 0,
        giftFromGuide: giftFromGuide || 0,
        giftFromBoatman: giftFromBoatman || 0,
        totalLessDeduction: totalLessDeduction,
        totalGiftDeduction: totalGiftDeduction,
        originalTotalLess: currentTotalLess,
        originalTotalGift: currentTotalGift,
        finalTotalLess: finalTotalLess,
        finalTotalGift: finalTotalGift,
        totalGuideAmount: totalGuideAmount,
        totalBoatmanAmount: totalBoatmanAmount,
        documentsUpdated: updatedSalesDocs.length,
        totalOrdersProcessed: allOrders.length
      }
    });
  } catch (error) {
    console.error('Error updating sales record:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the sales record.',
      error: error.message
    });
  }
};

// Get all guides and boatmen with their today's total earnings
const getAllEarningsByDateRange = async (req, res) => {
  try {
    // Get startDate and endDate from query parameters or request body
    const { startDate, endDate } = req.query.startDate ? req.query : req.body;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate are required parameters'
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format'
      });
    }

    // Set time boundaries for the date range
    const startOfPeriod = new Date(start);
    startOfPeriod.setHours(0, 0, 0, 0);

    const endOfPeriod = new Date(end);
    endOfPeriod.setHours(23, 59, 59, 999);

    // Validate date range
    if (startOfPeriod > endOfPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be later than end date'
      });
    }

    // Find all sales for the specified date range
    const salesData = await Sales.find({
      createdAt: {
        $gte: startOfPeriod,
        $lte: endOfPeriod
      }
    });

    const guideEarnings = {};
    const boatmanEarnings = {};

    salesData.forEach(sale => {
      sale.orders.forEach(order => {
        // Process guides
        if (order.guide && order.guide.name) {
          const guideName = order.guide.name.trim();
          if (!guideEarnings[guideName]) {
            guideEarnings[guideName] = {
              name: guideName,
              totalEarnings: 0,
              orderCount: 0
            };
          }
          guideEarnings[guideName].totalEarnings += order.guide.amount || 0;
          guideEarnings[guideName].orderCount += 1;
        }

        // Process boatmen
        if (order.forBoatman && order.forBoatman.length > 0) {
          order.forBoatman.forEach(boatman => {
            if (boatman.boatmanName) {
              const boatmanName = boatman.boatmanName.trim();
              if (!boatmanEarnings[boatmanName]) {
                boatmanEarnings[boatmanName] = {
                  name: boatmanName,
                  totalEarnings: 0,
                  orderCount: 0
                };
              }
              boatmanEarnings[boatmanName].totalEarnings += boatman.costAmount || 0;
              boatmanEarnings[boatmanName].orderCount += 1;
            }
          });
        }
      });
    });

    // Convert to arrays and sort by earnings
    const guides = Object.values(guideEarnings).sort((a, b) => b.totalEarnings - a.totalEarnings);
    const boatmen = Object.values(boatmanEarnings).sort((a, b) => b.totalEarnings - a.totalEarnings);

    // Calculate totals
    const totalGuidesEarnings = guides.reduce((sum, guide) => sum + guide.totalEarnings, 0);
    const totalBoatmenEarnings = boatmen.reduce((sum, boatman) => sum + boatman.totalEarnings, 0);

    res.status(200).json({
      success: true,
      data: {
        dateRange: {
          startDate: startOfPeriod.toISOString().split('T')[0],
          endDate: endOfPeriod.toISOString().split('T')[0]
        },
        guides: guides,
        boatmen: boatmen,
        summary: {
          totalGuides: guides.length,
          totalBoatmen: boatmen.length,
          totalGuidesEarnings: totalGuidesEarnings,
          totalBoatmenEarnings: totalBoatmenEarnings,
          grandTotal: totalGuidesEarnings + totalBoatmenEarnings,
          totalSales: salesData.length
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving earnings for the specified date range',
      error: error.message,
    });
  }
};


const reducePriceByOrderCode = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { orderCode, amountToReduce } = req.body;

    // 1. Validate the incoming data from the frontend
    if (!orderCode || !amountToReduce || typeof amountToReduce !== 'number' || amountToReduce <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid orderCode and a numeric amountToReduce greater than 0 are required.',
      });
    }

    // 2. Find ALL sales documents with the matching groupCode
    const salesDocs = await Sales.find({ groupCode });

    if (!salesDocs || salesDocs.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sales record not found with group code: ${groupCode}`,
      });
    }

    // 3. Find the specific sales document and order that matches the orderCode
    let salesDoc = null;
    let orderToUpdate = null;

    for (const doc of salesDocs) {
      const foundOrder = doc.orders.find(order => order.orderCode === orderCode);
      if (foundOrder) {
        salesDoc = doc;
        orderToUpdate = foundOrder;
        break;
      }
    }

    if (!orderToUpdate || !salesDoc) {
      return res.status(404).json({
        success: false,
        message: `Order with orderCode ${orderCode} not found in any document with group code ${groupCode}.`,
      });
    }

    // Store original price for logging/response
    const originalPrice = orderToUpdate.Price;

    // 4. Reduce the price for the matched order, ensuring it doesn't go below zero
    const newPrice = Math.max(0, orderToUpdate.Price - amountToReduce);
    orderToUpdate.Price = newPrice;

    // 5. Mark the 'orders' array as modified for Mongoose to detect the change
    salesDoc.markModified('orders');

    // 6. Save the updated sales document
    const updatedSales = await salesDoc.save();

    // Log the successful update
    console.log(`Price reduced for order ${orderCode}: ${originalPrice} -> ${newPrice}`);

    res.status(200).json({
      success: true,
      message: `Successfully reduced price for order ${orderCode} in group ${groupCode}.`,
      data: {
        groupCode: updatedSales.groupCode,
        orderCode: orderCode,
        originalPrice: originalPrice,
        amountReduced: amountToReduce,
        newPrice: newPrice,
        updatedOrder: orderToUpdate
      },
    });
  } catch (error) {
    console.error('Error in reducePriceByOrderCode:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the sales record.',
      error: error.message,
    });
  }
};


module.exports = {
  createSales,
  fetchOrders,
  fetchChartData,
  getDailyTotals,
  updateSalesByGroupCode,
  getAllEarningsByDateRange,
  reducePriceByOrderCode
};