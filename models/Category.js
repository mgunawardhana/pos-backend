const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: [true, 'Category ID is required'],
      unique: true,
      trim: true,
    },
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    reason: {
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

module.exports = mongoose.model('Category', categorySchema);
