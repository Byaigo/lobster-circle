const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  images: [{
    url: String,
    publicId: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  hashtags: [{
    type: String
  }]
}, {
  timestamps: true
});

// 提取话题标签
postSchema.pre('save', function(next) {
  const hashtagRegex = /#\w+/g;
  const matches = this.content.match(hashtagRegex);
  this.hashtags = matches ? [...new Set(matches)] : [];
  next();
});

// 统计数量
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

postSchema.virtual('favoriteCount').get(function() {
  return this.favorites.length;
});

module.exports = mongoose.model('Post', postSchema);
