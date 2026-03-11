# 🦞 龙虾圈 - Lobster Circle

一个功能完整的社交应用，包含移动应用、后台管理系统和完整的后端服务。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.2.0-blue.svg)](https://github.com/yourusername/lobster-circle)
[![Status](https://img.shields.io/badge/status-production--ready-green.svg)](https://github.com/yourusername/lobster-circle)

---

## 📱 项目简介

**龙虾圈** 是一个企业级社交应用，包含：
- 📱 React Native 移动应用（iOS/Android）
- 🔧 Node.js + Express 后端服务
- 💻 React + Ant Design 后台管理系统
- 📊 完整的数据分析和用户管理

---

## ✨ 功能特性

### 核心社交
- ✅ 用户注册/登录（JWT 认证）
- ✅ 信息流（下拉刷新）
- ✅ 发布动态（文字 + 图片）
- ✅ 点赞/收藏/评论
- ✅ 好友系统（请求/同意/拒绝）
- ✅ 私信聊天（实时 Socket.io）
- ✅ 通知中心
- ✅ 搜索功能
- ✅ 个人主页
- ✅ 深色模式

### 企业管理
- ✅ 后台管理 Web（13 个页面）
- ✅ 用户管理（封禁/解封/编辑/重置密码）
- ✅ 内容审核（删除动态）
- ✅ 举报处理
- ✅ 功能开关系统
- ✅ 敏感词过滤
- ✅ 操作日志
- ✅ 图片上传（本地 + 七牛云）
- ✅ 登录日志（IP/设备/浏览器）

### 运营功能
- ✅ 签到系统
- ✅ 积分系统
- ✅ 积分商城
- ✅ 推送通知（极光推送）
- ✅ 云存储（七牛云）
- ✅ 数据分析
- ✅ 用户反馈
- ✅ 版本控制
- ✅ 密码找回
- ✅ 账号注销

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MongoDB 5+
- npm 或 yarn
- Expo CLI（可选）

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/lobster-circle.git
cd lobster-circle
```

### 2. 启动后端

```bash
cd lobster-circle-backend
npm install
npm run init:admin
npm run init:config
npm run dev
```

### 3. 启动后台管理

```bash
cd lobster-circle-admin
npm install
npm start
```

访问 http://localhost:3001  
登录：`admin` / `admin123`

### 4. 启动前端

```bash
cd lobster-circle
npm install
npm start
```

手机下载 **Expo Go** 扫码预览

---

## 📁 项目结构

```
apps/
├── lobster-circle/              # React Native 前端
│   ├── App.js
│   ├── screens/                 # 页面组件
│   ├── components/              # 通用组件
│   ├── services/                # 服务层
│   └── config.js
│
├── lobster-circle-backend/      # Node.js 后端
│   ├── server.js
│   ├── models/                  # 数据库模型
│   ├── routes/                  # API 路由
│   ├── middleware/              # 中间件
│   └── services/                # 服务层
│
├── lobster-circle-admin/        # React 后台管理
│   ├── src/
│   │   ├── App.js
│   │   ├── components/          # 组件
│   │   └── pages/               # 页面
│   └── public/
│
└── docs/                        # 文档
    ├── STARTUP_GUIDE.md
    ├── PROJECT_SUMMARY.md
    └── ...
```

---

## 🛠️ 技术栈

### 前端
- React Native 0.73
- Expo 50
- React Navigation 6
- Socket.io Client

### 后端
- Node.js 18+
- Express 4
- MongoDB 5+
- Mongoose 8
- Socket.io 4
- JWT

### 后台管理
- React 18
- Ant Design 5
- React Router 6
- Recharts

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| [STARTUP_GUIDE.md](docs/STARTUP_GUIDE.md) | 启动指南 |
| [PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) | 项目总结 |
| [COMPREHENSIVE_ANALYSIS.md](docs/COMPREHENSIVE_ANALYSIS.md) | 功能分析 |
| [OPTIMIZATION_SUMMARY.md](docs/OPTIMIZATION_SUMMARY.md) | 优化总结 |
| [ADMIN_FEATURES.md](docs/ADMIN_FEATURES.md) | 后台功能 |

---

## 🔐 配置说明

### 后端配置

复制 `.env.example` 为 `.env`：

```bash
cd lobster-circle-backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/lobster-circle

# JWT 配置
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d

# 七牛云配置（可选）
QINIU_ACCESS_KEY=your_access_key
QINIU_SECRET_KEY=your_secret_key
QINIU_BUCKET=your_bucket_name
QINIU_DOMAIN=https://your-domain.com

# 极光推送配置（可选）
JPUSH_APP_KEY=your_app_key
JPUSH_MASTER_SECRET=your_master_secret
```

---

## 🧪 测试

### 后端测试

```bash
cd lobster-circle-backend
npm test
```

### 前端测试

```bash
cd lobster-circle
npm test
```

---

## 📊 项目统计

| 项目 | 数量 |
|------|------|
| **总文件数** | 85 个 |
| **总代码量** | ~275KB |
| **总文档量** | ~70KB |
| **后端 API** | 16 个路由 |
| **后台页面** | 13 个 |
| **前端页面** | 9 个 |
| **数据库模型** | 13 个 |

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。

---

## 👨‍💻 开发者

- **开发者**: 龙虾助手 🦞
- **版本**: 3.2.0
- **完成时间**: 2026-03-11

---

## 🎉 致谢

感谢以下开源项目：

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Ant Design](https://ant.design/)
- [Socket.io](https://socket.io/)
- [MongoDB](https://www.mongodb.com/)

---

## 📞 联系方式

- **项目主页**: https://github.com/yourusername/lobster-circle
- **问题反馈**: https://github.com/yourusername/lobster-circle/issues

---

**祝你使用愉快！** 🎉
