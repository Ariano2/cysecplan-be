const express = require('express');
const mongoose = require('mongoose');
const Article = require('../models/article');
const marked = require('marked');
const { adminAuth, participantAuth } = require('../middlewares/auth');
const articleRouter = express.Router();

// Create article (admin only)
articleRouter.post('/api/articles', adminAuth, async (req, res) => {
  const { title, banner, description, content, summary, tags, status } =
    req.body;
  const author = req.admin._id;

  try {
    const article = new Article({
      title,
      description,
      content,
      author,
    });
    await article.save();
    res.status(201).send(article);
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).send(err.message);
  }
});

// Update article (admin only)
articleRouter.put('/api/articles/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new Error('Invalid Article ID');
    const article = await Article.findById(id);
    if (!article) throw new Error('Article not found');

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'content'];
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) article[key] = updates[key];
    });

    await article.save();
    res.send(article);
  } catch (err) {
    res
      .status(
        err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500
      )
      .send(err.message);
  }
});

// Delete article (admin only)
articleRouter.delete('/api/articles/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new Error('Invalid Article ID');
    const article = await Article.findByIdAndDelete(id);
    if (!article) throw new Error('Article not found');
    res.send({ message: 'Article deleted successfully' });
  } catch (err) {
    res.status(err.name === 'CastError' ? 400 : 500).send(err.message);
  }
});

// Get single article (increments read count)
articleRouter.get('/api/articles/:id', participantAuth, async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new Error('Invalid Article ID');
    const article = await Article.findOne({
      _id: id,
    }).populate('author', 'firstName');
    if (!article) throw new Error('Article not found or not published');

    await article.incrementRead();

    // Add isLiked field for authenticated users
    const response = article.toObject();
    if (req.participant) {
      response.isLiked = article.activity.likeId.includes(req.participant._id);
    } else {
      response.isLiked = false;
    }

    res.send(response);
  } catch (err) {
    res.status(err.name === 'CastError' ? 400 : 404).send(err.message);
  }
});

// List articles
articleRouter.get('/api/articles', async (req, res) => {
  const { tag, page = 1, limit = 10 } = req.query;

  try {
    const articles = await Article.find({})
      .populate('author', 'firstName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    // Add isLiked field for each article if user is authenticated
    const modifiedArticles = articles.map((article) => {
      const articleObj = article.toObject();
      articleObj.isLiked = req.participant
        ? article.activity.likeId.includes(req.participant._id)
        : false;
      return articleObj;
    });

    const total = await Article.countDocuments({});
    res.send({
      articles: modifiedArticles,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Toggle like/unlike article (authenticated users)
articleRouter.post(
  '/api/articles/:id/like',
  participantAuth,
  async (req, res) => {
    const { id } = req.params;
    const userId = req.participant._id;

    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new Error('Invalid Article ID');
      const article = await Article.findOne({ _id: id });
      if (!article) throw new Error('Article not found');

      const isAlreadyLiked = article.activity.likeId.includes(userId);

      if (isAlreadyLiked) {
        await article.decrementLikes(userId);
        res.send({
          message: 'Article unliked',
          total_likes: article.activity.total_likes,
          isLiked: false,
        });
      } else {
        await article.incrementLikes(userId);
        res.send({
          message: 'Article liked',
          total_likes: article.activity.total_likes,
          isLiked: true,
        });
      }
    } catch (err) {
      res.status(err.name === 'CastError' ? 400 : 404).send(err.message);
    }
  }
);

module.exports = articleRouter;
