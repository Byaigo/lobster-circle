const mongoose = require('mongoose');

const operationLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    enum: ['user', 'post', 'report', 'config', 'system'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  targetType: {
    type: String
  },
  details: {
    type: Object
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// 索引
operationLogSchema.index({ adminId: 1, createdAt: -1 });
operationLogSchema.index({ module: 1, createdAt: -1 });

module.exports = mongoose.model('OperationLog', operationLogSchema);
