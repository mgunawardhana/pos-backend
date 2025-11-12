const mongoose = require('mongoose');

const receivedStockSchema = new mongoose.Schema(
  {
    receivedProductID: {
      type: String,
      required: [true, 'Received product id is required'],
      unique: true,
      trim: true,
    },
    receivedProductName: {
      type: String,
      required: [true, 'Received product name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Received product name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    qty:{
      type: Number,
      required: [true, 'Qty is required'],
      trim: true,
    },
    remark: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Created by is required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ReceivedStock', receivedStockSchema);
