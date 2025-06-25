const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, minLength: 3, maxLength: 100, required: true },
    price: { type: Number, min: 1, max: 10000000, required: true },
    category: {
      type: String,
      enum: ['insurance', 'book', 'course'],
      required: true,
    },
    imageUrl: { type: String },
    stock: { type: Number, default: 0, max: 100000 },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
