const express = require('express');
const fs = require('fs');
const path = require('path');
const productRouter = express.Router();
const { participantAuth, adminAuth } = require('../middlewares/auth');
const Product = require('../models/product');
const upload = require('../config/multer');
const { productValidator } = require('../validators/productValidator');

// Create new product
productRouter.post(
  '/api/product/create',
  adminAuth,
  upload.single('image'),
  async (req, res) => {
    const { name, stock, category, price } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    try {
      productValidator(req.body);
      const product = new Product({
        name,
        price,
        category,
        stock: stock || 0,
        imageUrl,
      });

      await product.save();
      res.send(product);
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }
);

// Edit existing product (including optional image)
productRouter.patch(
  '/api/product/edit/:productId',
  adminAuth,
  upload.single('image'),
  async (req, res) => {
    const { name, stock, category, price } = req.body;
    const { productId } = req.params;
    const imageFile = req.file;

    try {
      productValidator(req.body);
      const product = await Product.findById(productId);
      if (!product) throw new Error('invalid product ID');
      // If new image is uploaded, optionally delete the old one
      if (imageFile) {
        if (product.imageUrl) {
          const oldPath = path.join(process.cwd(), product.imageUrl);
          fs.unlink(oldPath, (err) => {
            if (err)
              console.warn('Old image not found or not deleted:', err.message);
          });
        }
        product.imageUrl = `/uploads/${imageFile.filename}`;
      }
      // Update remaining fields
      product.name = name || product.name;
      product.price = price || product.price;
      product.category = category || product.category;
      product.stock = stock !== undefined ? stock : product.stock;
      await product.save();
      res.send(product);
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }
);

// Get all products
productRouter.get('/api/product/viewAll', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageLimit = parseInt(req.query.pageLimit) || 10;
    const productList = await Product.find({})
      .limit(pageLimit)
      .skip((page - 1) * pageLimit);
    res.send(productList);
  } catch (err) {
    res.status(500).send('Server Error in fetching');
  }
});

// Delete a product
productRouter.delete(
  '/api/product/delete/:productId',
  adminAuth,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await Product.findByIdAndDelete(productId);

      if (product?.imageUrl) {
        const filePath = path.join(process.cwd(), product.imageUrl);
        fs.unlink(filePath, (err) => {
          if (err) console.warn('Could not delete image:', err.message);
        });
      }

      res.send('Deleted product');
    } catch (err) {
      res.status(500).send('Could Not Delete');
    }
  }
);

module.exports = productRouter;
