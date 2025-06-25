const mongoose = require('mongoose');
const cartItem = new mongoose.Schema({
  productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
});

const cartSchema = new mongoose.Schema({
  participantId: { type: mongoose.Types.ObjectId, ref: 'Participant' },
  items: { type: [cartItem], default: [] },
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = { Cart, cartSchema };
