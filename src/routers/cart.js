const express = require('express');
const Product = require('../models/product');
const { participantAuth } = require('../middlewares/auth');
const cartRouter = express.Router();
const { Cart } = require('../models/cart');
const Order = require('../models/order');
const mongoose = require('mongoose');

// add to cart
cartRouter.post('/api/cart/addItem', participantAuth, async (req, res) => {
  const { productId, quantity } = req.body;
  const parsedQuantity = parseInt(quantity, 10);
  const participantId = req.participant._id;

  try {
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new Error('Invalid Product ID');
    if (isNaN(parsedQuantity) || parsedQuantity <= 0)
      throw new Error('Invalid Quantity');

    // Check product
    const product = await Product.findById(productId);
    if (!product) throw new Error('Invalid Product ID');
    if (product.stock < parsedQuantity) throw new Error('Insufficient Stock');

    // Find or create cart
    let cart =
      (await Cart.findOne({ participantId })) ||
      new Cart({ participantId, items: [] });

    // Update or add item
    const index = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (index === -1) {
      cart.items.push({ productId, quantity: parsedQuantity });
    } else {
      const newQuantity = cart.items[index].quantity + parsedQuantity;
      if (newQuantity > product.stock) throw new Error('Insufficient Stock');
      cart.items[index].quantity = newQuantity;
    }

    await cart.save();
    res.send(cart);
  } catch (err) {
    res.status(err.name === 'CastError' ? 400 : 500).send(err.message);
  }
});

// remove from cart
cartRouter.post('/api/cart/removeItem', participantAuth, async (req, res) => {
  const { productId, quantity } = req.body;
  const parsedQuantity = quantity ? parseInt(quantity, 10) : undefined;
  const participantId = req.participant._id;

  try {
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new Error('Invalid Product ID');
    if (
      parsedQuantity !== undefined &&
      (isNaN(parsedQuantity) || parsedQuantity < 0)
    )
      throw new Error('Invalid Quantity');

    // Check cart and product
    const cart = await Cart.findOne({ participantId });
    if (!cart) throw new Error('Cart Invalid');
    const product = await Product.findById(productId);
    if (!product) throw new Error('Invalid Product ID');

    // Find item
    const index = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (index === -1) throw new Error(`Product with ${productId} not in cart`);

    // Remove or reduce quantity
    if (parsedQuantity === undefined) {
      cart.items.splice(index, 1);
    } else {
      if (cart.items[index].quantity < parsedQuantity)
        throw new Error('Invalid Quantity');
      cart.items[index].quantity -= parsedQuantity;
      if (cart.items[index].quantity === 0) cart.items.splice(index, 1);
    }

    await cart.save();
    res.send(cart);
  } catch (err) {
    res.status(err.name === 'CastError' ? 400 : 500).send(err.message);
  }
});

//get cart
cartRouter.get('/api/cart', participantAuth, async (req, res) => {
  const participantId = req.participant._id;

  try {
    let cart = await Cart.findOne({ participantId });
    if (!cart) {
      cart = new Cart({ participantId, items: [] });
      await cart.save();
    }
    res.send(cart);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

//create order
cartRouter.post('/api/cart/order', participantAuth, async (req, res) => {
  const participantId = req.participant._id;

  try {
    // Find cart
    const cart = await Cart.findOne({ participantId });
    if (!cart || cart.items.length === 0) throw new Error('Cart is Empty');

    // Validate items and collect prices
    const prices = [];
    const validItems = await Promise.all(
      cart.items.map(async (element) => {
        if (!mongoose.Types.ObjectId.isValid(element.productId)) return false;
        const product = await Product.findById(element.productId);
        if (!product || element.quantity > product.stock) return false;
        prices.push({ productId: element.productId, price: product.price });
        return true;
      })
    );

    if (validItems.includes(false)) throw new Error('Invalid Cart');

    // Update stock (non-atomic)
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (product.stock < item.quantity) throw new Error('Insufficient Stock'); // Re-check stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((acc, item) => {
      const price = prices.find(
        (p) => p.productId.toString() === item.productId.toString()
      ).price;
      return acc + item.quantity * price;
    }, 0);

    // Create order
    const order = new Order({ cart, totalAmount });
    await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.send(order);
  } catch (err) {
    res.status(err.name === 'CastError' ? 400 : 500).send(err.message);
  }
});

// simulate payment
cartRouter.post('/api/cart/pay', participantAuth, async (req, res) => {
  const { orderId } = req.body;
  const participantId = req.participant._id;

  try {
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(orderId))
      throw new Error('Invalid Order ID');

    // Find order
    const order = await Order.findOne({ _id: orderId });
    if (!order) throw new Error('Order not found');
    if (!order.cart.participantId.equals(participantId))
      throw new Error('Unauthorized');

    // Check if order is already processed
    if (order.status !== 'pending') throw new Error('Order already processed');

    // Simulate payment (80% success rate)
    const paymentSuccessful = Math.random() < 0.8;

    // Update order status
    order.status = paymentSuccessful ? 'completed' : 'cancelled';
    await order.save();

    res.send({
      order,
      paymentStatus: paymentSuccessful ? 'success' : 'failed',
      message: paymentSuccessful ? 'Payment successful' : 'Payment failed',
    });
  } catch (err) {
    res.status(err.name === 'CastError' ? 400 : 500).send(err.message);
  }
});

//get orders
cartRouter.get('/api/orders', participantAuth, async (req, res) => {
  const participantId = req.participant._id;

  try {
    let orders = await Order.find({ 'cart.participantId': participantId });
    res.send(orders);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = cartRouter;
