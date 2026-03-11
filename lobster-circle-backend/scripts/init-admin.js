/**
 * 🦞 龙虾圈 - 初始化管理员脚本
 * 
 * 使用方法：
 * node scripts/init-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

dotenv.config();

async function initAdmin() {
  try {
    // 连接 MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lobster-circle');
    console.log('✅ MongoDB 连接成功');

    // 检查是否已有管理员
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  管理员账号已存在');
      console.log('用户名：admin');
      console.log('角色：', existingAdmin.role);
      process.exit(0);
    }

    // 创建管理员
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await Admin.create({
      username: 'admin',
      password: hashedPassword,
      role: 'super_admin',
      permissions: {
        banUser: true,
        deletePost: true,
        viewStats: true,
        manageAdmins: true
      }
    });

    console.log('✅ 管理员账号创建成功！');
    console.log('─────────────────────────────────');
    console.log('用户名：admin');
    console.log('密码：admin123');
    console.log('角色：super_admin');
    console.log('─────────────────────────────────');
    console.log('⚠️  请首次登录后立即修改密码！');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

initAdmin();
