const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin'],
    default: 'admin'
  },
  permissions: {
    banUser: { type: Boolean, default: true },
    deletePost: { type: Boolean, default: true },
    viewStats: { type: Boolean, default: true },
    manageAdmins: { type: Boolean, default: false } // 仅 super_admin
  },
  lastLogin: {
    type: Date
  },
  isOnline: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 密码加密
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 密码验证
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
