const mongoose = require('mongoose');

const sensitiveWordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['politics', 'porn', 'violence', 'spam', 'ad', 'other'],
    default: 'other'
  },
  level: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  action: {
    type: String,
    enum: ['block', 'replace', 'review'],
    default: 'block'
  },
  replaceWith: {
    type: String,
    default: '***'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 索引
sensitiveWordSchema.index({ word: 1 });

module.exports = mongoose.model('SensitiveWord', sensitiveWordSchema);
