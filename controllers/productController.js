const Product = require('../models/Product');
const ReceivedStock = require('../models/ReceivedStock'); // Fixed typo: 'RecievedStocks' to 'ReceivedStock'
const mongoose = require('mongoose');

// @desc    Get all products
// @route   GET /api/products/:page/:size
// @access  Private
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const size = parseInt(req.params.size) || 10;

    const skip = (page - 1) * size;

    const products = await Product.find()
      .skip(skip)
      .limit(size);

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / size);

    console.info(`Fetched products for page ${page}, size ${size}`);

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        size,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      createdBy: req.body.createdBy || req.user?.name || req.user?._id?.toString(),
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error.stack);
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Find the existing product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update the product with new data
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.body.updatedBy || req.user?.name || req.user?._id?.toString(),
      },
      { new: true, runValidators: true }
    );

    // If stocks are being updated and increased, create or update ReceivedStock
    const newStock = req.body.stocks;
    if (newStock !== undefined && newStock > product.stocks) {
      const stockDifference = newStock - product.stocks;

      // Try to find existing ReceivedStock
      let receivedStock = await ReceivedStock.findOne({
        receivedProductID: product.itemCode,
      });

      if (!receivedStock) {
        // Create new ReceivedStock with all required fields
        receivedStock = new ReceivedStock({
          receivedProductID: product.itemCode,
          receivedProductName: product.itemName,
          qty: stockDifference,
          category: req.body.categoryName || product.categoryName,
          remark: `Stock updated by ${req.body.updatedBy || 'admin'}`,
          createdBy: req.body.updatedBy || req.user?.name || 'admin',
          productName: product.itemName
        });
      } else {
        // Update existing ReceivedStock
        receivedStock.qty = Math.max(0, receivedStock.qty - stockDifference);
      }

      await receivedStock.save();
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error.stack);
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};
// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};