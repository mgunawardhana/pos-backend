const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema(
  {
    groupCode: {
      type: String,
      required: [true, 'Group code is required'],
      trim: true,
    },
    orders: [
      {
        guide:{
          name:{
            type: String,
            required: [true, 'Guide name is required'],
            trim: true,
          },
          percentage: {
            type: Number,
            required: [true, 'Guide percentage is required'],
            trim: true,
          },
          amount: {
            type: Number,
            required: [true, 'Guide amount is required'],
            trim: true,
          }
        },
        orderCode: {
          type: String,
          required: [true, 'Order code is required'],
          trim: true,
        },
        company: {
          percentage: {
            type: Number,
            required: [true, 'Company percentage is required'],
            trim: true,
          },
          amount: {
            type: Number,
            required: [true, 'Company amount is required'],
            trim: true,
          }
        },
        discount: {
          percentage: {
            type: Number,
            required: [true, 'Discount percentage is required'],
            trim: true,
          },
          amount: {
            type: Number,
            required: [true, 'Discount amount is required'],
            trim: true,
          }
        },
        selectedProducts: [
          {
            productId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Product',
              required: [true, 'Product ID is required'],
            },
            productName: {
              type: String,
              required: [true, 'Product name is required'],
              trim: true,
            },
            quantity: {
              type: Number,
              required: [true, 'Quantity is required'],
              min: 1,
            },
          },
        ],
        forBoatman: [
          {
            boatmanName: {
              type: String,
              required: [true, 'Boatman name is required'],
              trim: true,
            },
            percentage: {
              type: Number,
              required: [true, 'Percentage is required'],
              trim: true,
            },
            costAmount: {
              type: Number,
              required: [true, 'Cost amount is required'],
              trim: true,
            },
          },
        ],
        gift: {
          type: Number,
          required: [true, 'Gift is required'],
          trim: true,
        },
        Price: {
          type: Number,
          required: [true, 'Price is required'],
          trim: true,
        },
        itemWiseTotal: {
          type: Number,
          required: [true, 'Item wise total is required'],
          trim: true,
        },
        categoryCode: {
          type: String,
          required: [true, 'Category code is required'],
          trim: true,
        },
        exotic: {
          type: Boolean,
          required: [true,'Exotic is required'],
          default: false,
        },
        less: {
          type: Number,
          required: [true, 'Less is required'],
          trim: true,
        },
        demonstratorName:{
          type: String,
          required: [true, 'Demonstrator name is required'],
          trim: true,
        },
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sales', salesSchema);