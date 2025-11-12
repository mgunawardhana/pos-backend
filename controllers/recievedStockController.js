const ReceivedStock = require('../models/ReceivedStock');

// @desc    Get all received stocks
// @route   GET /api/received-stocks
// @access  Private
exports.getAllReceivedStocks = async (req, res) => {
  try {
    const receivedStocks = await ReceivedStock.find();
    res.status(200).json({
      success: true,
      count: receivedStocks.length,
      data: receivedStocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single received stock
// @route   GET /api/received-stocks/:id
// @access  Private
exports.getReceivedStock = async (req, res) => {
  try {
    const receivedStock = await ReceivedStock.findById(req.params.id);

    if (!receivedStock) {
      return res.status(404).json({
        success: false,
        error: 'No received stock found'
      });
    }

    res.status(200).json({
      success: true,
      data: receivedStock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new received stock
// @route   POST /api/received-stocks
// @access  Private
exports.createReceivedStock = async (req, res) => {
  try {
    const receivedStock = await ReceivedStock.create(req.body);

    res.status(201).json({
      success: true,
      data: receivedStock
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);

      return res.status(400).json({
        success: false,
        error: messages
      });
    } else if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate value entered'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// @desc    Update received stock
// @route   PUT /api/received-stocks/:id
// @access  Private
exports.updateReceivedStock = async (req, res) => {
  try {
    const receivedStock = await ReceivedStock.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!receivedStock) {
      return res.status(404).json({
        success: false,
        error: 'No received stock found'
      });
    }

    res.status(200).json({
      success: true,
      data: receivedStock
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);

      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// @desc    Delete received stock
// @route   DELETE /api/received-stocks/:id
// @access  Private
exports.deleteReceivedStock = async (req, res) => {
  try {
    const receivedStock = await ReceivedStock.findByIdAndDelete(req.params.id);

    if (!receivedStock) {
      return res.status(404).json({
        success: false,
        error: 'No received stock found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};