# 🦞 龙虾圈 - Lobster Circle

一个功能完整的社交 App，支持前后端完整交互。

## ✨ 完整功能

### 核心功能
- ✅ 用户注册/登录（JWT 认证）
- ✅ 信息流（下拉刷新）
- ✅ 发布动态（文字 + 图片 + 可见范围）
- ✅ 点赞/收藏/评论
- ✅ 好友系统（请求/同意/拒绝）
- ✅ 私信聊天（实时 Socket.io）
- ✅ 通知中心
- ✅ 搜索功能
- ✅ 话题标签
- ✅ 深色模式

### 页面列表
1. **首页** 🏠 - 信息流、发布、点赞、评论
2. **通知** 🔔 - 互动通知
3. **好友** 👥 - 好友列表、好友请求、添加好友
4. **消息** 💬 - 私信会话列表
5. **我的** 👤 - 个人主页、设置

---

## 🚀 快速开始

### 前置要求

**必须安装：**
- Node.js v16+ ([下载](https://nodejs.org/))
- MongoDB v5+ ([下载](https://www.mongodb.com/try/download/community))
  - 或使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)（云端免费）

### 1. 启动后端

```bash
# 进入后端目录
cd C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle-backend

# 安装依赖
npm install

# 启动 MongoDB（如果已安装为服务）
net start MongoDB

# 启动后端服务器
npm start
```

后端将在 `http://localhost:3000` 运行

### 2. 启动前端

```bash
# 进入前端目录
cd C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle

# 安装依赖
npm install

# 启动 Expo
npm start

# 手机下载 Expo Go，扫描二维码
```

---

## 📁 项目结构

```
lobster-circle/
├── App.js              # 主应用（37KB 完整版）
├── api.js              # API 客户端（封装所有后端 API）
├── socket.js           # Socket.io 客户端（实时消息）
├── config.js           # 配置文件
├── package.json        # 依赖配置
├── screens/            # 页面组件
│   ├── FriendsScreen.js # 好友页面
│   └── ChatScreen.js    # 聊天页面
└── README.md           # 说明文档

lobster-circle-backend/
├── server.js           # 主服务器
├── models/             # 数据库模型
│   ├── User.js
│   ├── Post.js
│   ├── Message.js
│   └── FriendRequest.js
├── routes/             # API 路由
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── messages.js
│   └── friends.js
├── middleware/
│   └── auth.js         # JWT 认证
├── .env                # 环境变量
└── README.md           # 后端文档
```

---

## 🔧 配置

### 后端配置（.env）

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lobster-circle
JWT_SECRET=your-super-secret-key-change-this
```

### 前端配置（config.js）

```javascript
export const API_BASE_URL = 'http://localhost:3000/api';
export const SOCKET_URL = 'http://localhost:3000';
```

---

## 📡 API 文档

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户

### 动态
- `GET /api/posts/feed` - 获取信息流
- `POST /api/posts` - 发布动态
- `POST /api/posts/:id/like` - 点赞
- `POST /api/posts/:id/favorite` - 收藏
- `POST /api/posts/:id/comment` - 评论

### 好友
- `POST /api/friends/request` - 发送好友请求
- `GET /api/friends/requests/received` - 收到的请求
- `POST /api/friends/requests/:id/accept` - 同意
- `POST /api/friends/requests/:id/reject` - 拒绝
- `GET /api/friends/list` - 好友列表
- `DELETE /api/friends/:id` - 删除好友

### 消息
- `GET /api/messages/conversations` - 会话列表
- `GET /api/messages/conversation/:userId` - 聊天记录
- `POST /api/messages/send` - 发送消息
- `POST /api/messages/read` - 标记已读

### WebSocket 事件
- `user_online` - 用户上线
- `send_message` - 发送消息
- `new_message` - 接收新消息
- `message_read` - 标记已读
- `user_status` - 在线状态

---

## 🛠️ 技术栈

### 前端
| 技术 | 用途 |
|------|------|
| React Native | 跨平台框架 |
| Expo | 开发工具链 |
| React Navigation | 路由导航 |
| Socket.io Client | 实时通信 |
| AsyncStorage | 本地存储 |

### 后端
| 技术 | 用途 |
|------|------|
| Node.js | 运行时 |
| Express | Web 框架 |
| Socket.io | WebSocket |
| MongoDB | 数据库 |
| Mongoose | ODM |
| JWT | 认证 |
| bcryptjs | 密码加密 |

---

## 📱 功能截图

### 主要功能
- 底部 5 个 Tab 导航
- 深色模式切换
- 实时私信聊天
- 好友请求管理
- 动态发布（文字 + 图片）
- 点赞/收藏/评论互动

---

## 🔒 安全说明

1. **生产环境** 修改 `JWT_SECRET`
2. **启用 HTTPS**
3. **配置 CORS** 限制来源
4. **输入验证** 防止注入攻击
5. **定期备份** 数据库

---

## 🚀 部署

### 后端部署

**方案 A：Heroku**
```bash
heroku create lobster-circle-api
heroku addons:create mongolab:sandbox
git push heroku main
```

**方案 B：阿里云/腾讯云 ECS**
- 购买服务器
- 安装 Node.js + MongoDB
- 使用 PM2 管理进程

### 前端部署

**打包 APK：**
```bash
cd lobster-circle
npx eas build -p android
```

**打包 IPA（需要 Mac + 苹果开发者账号）：**
```bash
npx eas build -p ios
```

---

## 📝 开发说明

### 添加新功能

1. 在 `backend/models/` 创建数据模型
2. 在 `backend/routes/` 创建 API 路由
3. 在 `api.js` 添加前端 API 方法
4. 在对应页面使用

### 调试

**后端：**
```bash
npm run dev  # 自动重启
```

**前端：**
```bash
npm start    # Expo 开发服务器
```

---

## 🦞 关于

**版本**: 2.0.0 (完整版)  
**开发时间**: 2026-03-11  
**开发者**: 🦞 龙虾助手

---

**祝你使用愉快！** 🎉
