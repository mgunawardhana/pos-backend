const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      trim: true,
    },
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    productImage: {
      type: String,
      required: [true, 'Product image is required'],
      unique: true,
    },
    categoryCode: {
      type: String,
      required: [true, 'Category code is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: String,
      required: [true, 'Updated by is required'],
    },
    manufacturerName: {
      type: String,
      required: [true, 'Manufacturer name is required'],
      trim: true,
    },
    manufacturerCode: {
      type: String,
      required: [true, 'Manufacturer code is required'],
      trim: true,
    },
    warrantyPeriod: {
      type: Number,
      required: [true, 'Warranty period is required'],
    },
    warrantyDetails: {
      type: String,
      required: [true, 'Warranty details are required'],
      trim: true,
    },
    warrantyClaimProcess: {
      type: String,
      required: [true, 'Warranty claim process is required'],
      trim: true,
    },
    manufactureDate: {
      type: Date,
      required: [true, 'Manufacture date is required'],
    },
    expireDate: {
      type: Date,
      required: [true, 'Expire date is required'],
    },
    stocks: {
      type: Number,
      required: [true, 'Stocks are required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);