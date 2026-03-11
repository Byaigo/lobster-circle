# 🦞 龙虾圈 - 专业启动指南

## 📋 目录

1. [环境准备](#1-环境准备)
2. [快速启动](#2-快速启动)
3. [功能测试](#3-功能测试)
4. [配置说明](#4-配置说明)
5. [常见问题](#5-常见问题)

---

## 1. 环境准备

### 必须安装

| 软件 | 版本 | 下载链接 |
|------|------|----------|
| Node.js | 18+ | https://nodejs.org/ |
| MongoDB | 5+ | https://www.mongodb.com/try/download/community |
| Git | 最新 | https://git-scm.com/ |

### 验证安装

```bash
# 检查 Node.js
node -v
# 应该显示：v18.x.x 或更高

# 检查 npm
npm -v
# 应该显示：9.x.x 或更高

# 检查 MongoDB
mongod --version
# 应该显示：5.x.x 或更高
```

---

## 2. 快速启动

### 步骤 1：启动 MongoDB

**Windows:**
```bash
# 如果 MongoDB 已安装为服务
net start MongoDB

# 如果未安装为服务
mongod --dbpath "C:\data\db"
```

**Mac/Linux:**
```bash
brew services start mongodb-community
# 或
sudo systemctl start mongod
```

### 步骤 2：启动后端

```bash
# 进入后端目录
cd C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle-backend

# 首次使用 - 安装依赖
npm install

# 首次使用 - 初始化管理员账号
npm run init:admin

# 首次使用 - 初始化系统配置
npm run init:config

# 启动开发服务器（自动重启）
npm run dev
```

**预期输出:**
```
✅ MongoDB 连接成功
🦞 龙虾圈后端服务器运行在端口 3000
📡 WebSocket 已启用
🌐 http://localhost:3000
```

**验证后端:**
打开浏览器访问：http://localhost:3000/api/health

应该看到：
```json
{
  "status": "ok",
  "message": "🦞 龙虾圈后端运行中"
}
```

### 步骤 3：启动后台管理

```bash
# 打开新终端
cd C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle-admin

# 安装依赖
npm install

# 启动开发服务器
npm start
```

**预期输出:**
```
Compiled successfully!

You can now view lobster-circle-admin in the browser.

  Local:            http://localhost:3001
```

**访问后台:**
1. 打开浏览器：http://localhost:3001
2. 登录：`admin` / `admin123`

### 步骤 4：启动前端

```bash
# 打开新终端
cd C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle

# 安装依赖
npm install

# 启动 Expo
npm start
```

**预期输出:**
```
┌────────────────────────────────────┐
│   Your app is running at:          │
│                                    │
│   ▸ Scan QR Code with Expo Go     │
│   ▸ http://localhost:19002        │
│                                    │
└────────────────────────────────────┘
```

**手机预览:**
1. 手机下载 **Expo Go**（App Store / 应用商店）
2. 扫描终端显示的二维码
3. App 在手机上运行！

---

## 3. 功能测试

### 后端 API 测试

```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 测试管理员登录
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 测试获取统计数据（需要 token）
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 运行自动化测试

```bash
# 后端测试
cd lobster-circle-backend
npm test

# 前端测试
cd lobster-circle
npm test
```

### 功能测试清单

- [ ] 用户注册
- [ ] 用户登录
- [ ] 发布动态
- [ ] 点赞动态
- [ ] 评论动态
- [ ] 发送好友请求
- [ ] 接受好友请求
- [ ] 发送私信
- [ ] 接收私信
- [ ] 签到
- [ ] 查看数据分析
- [ ] 后台管理登录
- [ ] 用户管理
- [ ] 内容审核
- [ ] 系统配置

---

## 4. 配置说明

### 环境变量配置

**后端 .env 文件:**
```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/lobster-circle

# JWT 配置
JWT_SECRET=lobster-circle-super-secret-key-change-this-in-production-2026
JWT_EXPIRE=7d

# 跨域配置
CORS_ORIGIN=http://localhost:19006

# 七牛云配置（可选）
QINIU_ACCESS_KEY=your_access_key
QINIU_SECRET_KEY=your_secret_key
QINIU_BUCKET=your_bucket_name
QINIU_DOMAIN=https://your-domain.com

# 极光推送配置（可选）
JPUSH_APP_KEY=your_app_key
JPUSH_MASTER_SECRET=your_master_secret

# Redis 配置（可选）
REDIS_URL=redis://localhost:6379
```

### 第三方服务配置

#### 七牛云（云存储）

1. 注册：https://portal.qiniu.com/
2. 创建存储桶
3. 获取 Access Key 和 Secret Key
4. 配置到 .env 文件

#### 极光推送（推送通知）

1. 注册：https://www.jiguang.cn/
2. 创建应用
3. 获取 App Key 和 Master Secret
4. 配置到 .env 文件

---

## 5. 常见问题

### 问题 1：MongoDB 连接失败

**错误:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**解决:**
```bash
# 检查 MongoDB 是否运行
net start MongoDB

# 或手动启动
mongod --dbpath "C:\data\db"
```

### 问题 2：端口被占用

**错误:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决:**
```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :3000

# 杀死进程
taskkill /PID <进程 ID> /F

# 或修改 .env 中的端口
PORT=3001
```

### 问题 3：npm install 失败

**错误:**
```
npm ERR! network timeout at: https://registry.npmjs.org/
```

**解决:**
```bash
# 切换淘宝镜像
npm config set registry https://registry.npmmirror.com

# 清除缓存
npm cache clean --force

# 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题 4：Expo 无法连接

**解决:**
1. 确保手机和电脑在同一 WiFi
2. 使用隧道模式：`npx expo start --tunnel`
3. 检查防火墙设置

### 问题 5：管理员账号不存在

**解决:**
```bash
cd lobster-circle-backend
npm run init:admin
```

---

## 📞 获取帮助

**文档:**
- 后端文档：`lobster-circle-backend/README.md`
- 前端文档：`lobster-circle/README.md`
- 部署指南：`DEPLOYMENT_CHECKLIST.md`
- 功能说明：`ENTERPRISE_FEATURES.md`

**日志:**
```bash
# 查看后端日志
npm run dev

# 查看 MongoDB 日志
# Windows: C:\Program Files\MongoDB\Server\5.0\log
```

---

## 🎯 下一步

1. ✅ 完成本地测试
2. 📱 邀请朋友测试
3. 🚀 准备上线（查看 DEPLOYMENT_CHECKLIST.md）
4. 📊 配置数据分析
5. 🔔 配置推送通知
6. ☁️ 配置云存储

---

**祝你使用愉快！** 🎉

**版本**: 3.1.0  
**更新时间**: 2026-03-11  
**开发者**: 🦞 龙虾助手
