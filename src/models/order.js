const mongoose = require('mongoose');
const { cartSchema } = require('../models/cart');
const orderSchema = new mongoose.Schema(
  {
    cart: { type: cartSchema, required: true },
    totalAmount: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      required: true,
    },
  },
  { timeStamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
