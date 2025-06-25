const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment must be at least 1 character'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      required: [true, 'Author is required'],
      ref: 'Participant',
    },
    article: {
      type: Schema.Types.ObjectId,
      required: [true, 'Article is required'],
      ref: 'Article',
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  }
);

// Indexes for common queries
commentSchema.index({ article: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

// Pre-save hook to update article's comment count
commentSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      await mongoose
        .model('Article')
        .findByIdAndUpdate(
          this.article,
          { $inc: { 'activity.total_comments': 1 } },
          { new: true }
        );
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-remove hook to update article's comment count
commentSchema.pre('remove', async function (next) {
  try {
    await mongoose
      .model('Article')
      .findByIdAndUpdate(
        this.article,
        { $inc: { 'activity.total_comments': -1 } },
        { new: true }
      );
  } catch (error) {
    return next(error);
  }
  next();
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
