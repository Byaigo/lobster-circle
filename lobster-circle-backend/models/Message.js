const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'emoji', 'system'],
    default: 'text'
  },
  imageUrl: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 创建会话 ID（确保两人之间的对话 ID 一致）
messageSchema.statics.getConversationId = function(userId1, userId2) {
  return [userId1, userId2].sort().join('_');
};

// 索引
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ from: 1, to: 1 });

module.exports = mongoose.model('Message', messageSchema);
