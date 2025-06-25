const mongoose = require('mongoose');
const { Schema } = mongoose;

const articleSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      required: [true, 'Author is required'],
      ref: 'Admin',
    },
    activity: {
      total_likes: { type: Number, default: 0, min: 0 },
      total_comments: { type: Number, default: 0, min: 0 },
      total_reads: { type: Number, default: 0, min: 0 },
    },
    comments: {
      type: [Schema.Types.ObjectId],
      ref: 'Comment',
      default: [],
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
articleSchema.index({ author: 1 });

// Methods
articleSchema.methods.incrementLikes = async function () {
  this.activity.total_likes += 1;
  await this.save();
};

articleSchema.methods.decrementLikes = async function () {
  this.activity.total_likes = Math.max(0, this.activity.total_likes - 1);
  await this.save();
};

articleSchema.methods.incrementRead = async function () {
  this.activity.total_reads += 1;
  await this.save();
};

articleSchema.methods.incrementComments = async function () {
  this.activity.total_comments += 1;
  await this.save();
};

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;
