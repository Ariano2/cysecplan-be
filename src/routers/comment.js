const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/comment');
const Article = require('../models/article'); // Fixed import path to match your original article model
const { participantAuth } = require('../middlewares/auth');
const commentRouter = express.Router();

// Post comment (authenticated users)
commentRouter.post(
  '/api/articles/:articleId/comments',
  participantAuth,
  async (req, res) => {
    const { articleId } = req.params;
    const { content, parentCommentId } = req.body;
    const author = req.participant._id;

    try {
      if (!mongoose.Types.ObjectId.isValid(articleId)) {
        throw new Error('Invalid Article ID');
      }

      const article = await Article.findOne({ _id: articleId });
      if (!article) {
        throw new Error('Article not found');
      }

      // Validate parentCommentId if provided
      if (
        parentCommentId &&
        !mongoose.Types.ObjectId.isValid(parentCommentId)
      ) {
        throw new Error('Invalid Parent Comment ID');
      }

      const comment = new Comment({
        content,
        author,
        article: articleId,
        parentComment: parentCommentId || null,
      });
      await comment.save();

      // Update article's comments array
      article.comments.push(comment._id);
      await article.save();

      const populatedComment = await Comment.findById(comment._id).populate(
        'author',
        'firstName'
      );
      res.status(201).send(populatedComment);
    } catch (err) {
      res
        .status(
          err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500
        )
        .send(err.message);
    }
  }
);

// Get comments for an article (public)
commentRouter.get('/api/articles/:articleId/comments', async (req, res) => {
  const { articleId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      throw new Error('Invalid Article ID');
    }

    const article = await Article.findOne({ _id: articleId });
    if (!article) {
      throw new Error('Article not found');
    }

    const comments = await Comment.find({
      article: articleId,
      parentComment: null,
    })
      .populate('author', 'firstName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const total = await Comment.countDocuments({
      article: articleId,
      parentComment: null,
    });

    res.send({
      comments,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(err.name === 'CastError' ? 400 : 404).send(err.message);
  }
});

// Get replies for a comment (public)
// commentRouter.get('/api/comments/:commentId/replies', async (req, res) => {
//   const { commentId } = req.params;
//   const { page = 1, limit = 10 } = req.query;

//   try {
//     if (!mongoose.Types.ObjectId.isValid(commentId)) {
//       throw new Error('Invalid Comment ID');
//     }

//     const comment = await Comment.findById(commentId);
//     if (!comment) {
//       throw new Error('Comment not found');
//     }

//     const replies = await Comment.find({ parentComment: commentId })
//       .populate('author', 'firstName')
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit, 10));

//     const total = await Comment.countDocuments({ parentComment: commentId });

//     res.send({
//       replies,
//       total,
//       page: parseInt(page, 10),
//       pages: Math.ceil(total / limit),
//     });
//   } catch (err) {
//     res.status(err.name === 'CastError' ? 400 : 404).send(err.message);
//   }
// });

// Update comment (author only)
commentRouter.put('/api/comments/:id', participantAuth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.participant._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid Comment ID');
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is author
    if (!comment.author.equals(userId)) {
      throw new Error('Unauthorized to edit this comment');
    }

    comment.content = content;
    await comment.save();

    const populatedComment = await Comment.findById(id).populate(
      'author',
      'firstName'
    );
    res.send(populatedComment);
  } catch (err) {
    res
      .status(
        err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 403
      )
      .send(err.message);
  }
});

// Delete comment (author or admin only)
commentRouter.delete('/api/comments/:id', participantAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.participant._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid Comment ID');
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is author

    if (!comment.author.equals(userId)) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Remove comment from article's comments array
    await Article.findByIdAndUpdate(comment.article, {
      $pull: { comments: comment._id },
    });

    // Delete comment and its replies
    await Comment.deleteMany({ $or: [{ _id: id }, { parentComment: id }] });

    res.send({ message: 'Comment and its replies deleted successfully' });
  } catch (err) {
    res.status(err.name === 'CastError' ? 400 : 403).send(err.message);
  }
});

module.exports = commentRouter;
