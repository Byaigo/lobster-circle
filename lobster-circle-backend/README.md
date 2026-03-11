# 🦞 龙虾圈后端 - Lobster Circle Backend

完整的社交 App 后端服务（企业版 v2.0），支持好友系统、私信聊天、后台管理、图片上传等功能。

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Node.js | 运行时环境 |
| Express | Web 框架 |
| Socket.io | 实时通信（私信） |
| MongoDB | 数据库 |
| Mongoose | MongoDB ODM |
| JWT | 用户认证 |
| bcryptjs | 密码加密 |
| Multer | 文件上传 |

---

## ✨ 功能列表（v2.0）

### ✅ 已实现

| 功能模块 | API 端点 | 状态 |
|----------|---------|------|
| **用户认证** | POST /api/auth/* | ✅ |
| **动态管理** | POST /api/posts/* | ✅ |
| **好友系统** | POST /api/friends/* | ✅ |
| **私信聊天** | POST /api/messages/* + Socket | ✅ |
| **后台管理** | POST /api/admin/* | ✅ NEW |
| **图片上传** | POST /api/upload/* | ✅ NEW |
| **举报系统** | POST /api/reports/* | ✅ NEW |
| **通知系统** | GET /api/notifications/* | ✅ NEW |

---

## 🚀 快速开始

### 1. 环境要求

- **Node.js** v16+ ([下载](https://nodejs.org/))
- **MongoDB** v5+ ([下载](https://www.mongodb.com/try/download/community))

### 2. 安装依赖

```bash
cd C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle-backend
npm install
```

### 3. 配置环境变量

编辑 `.env` 文件：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lobster-circle
JWT_SECRET=your-super-secret-key-change-this
```

### 4. 启动 MongoDB

```bash
net start MongoDB
```

### 5. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 运行

---

## 📡 API 文档

### 认证 API

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

### 动态 API

```http
GET  /api/posts/feed
POST /api/posts
POST /api/posts/:id/like
POST /api/posts/:id/favorite
POST /api/posts/:id/comment
DELETE /api/posts/:id
```

### 好友 API

```http
POST /api/friends/request
GET  /api/friends/requests/received
POST /api/friends/requests/:id/accept
POST /api/friends/requests/:id/reject
GET  /api/friends/list
DELETE /api/friends/:id
```

### 消息 API

```http
GET  /api/messages/conversations
GET  /api/messages/conversation/:userId
POST /api/messages/send
POST /api/messages/read
```

### 后台管理 API 🔥 NEW

```http
POST /api/admin/login              # 管理员登录
GET  /api/admin/stats              # 统计数据
GET  /api/admin/users              # 用户列表
POST /api/admin/users/:id/ban      # 封禁/解封用户
GET  /api/admin/posts              # 动态列表
DELETE /api/admin/posts/:id        # 删除动态
GET  /api/admin/reports            # 举报列表
POST /api/admin/reports/:id/handle # 处理举报
```

### 图片上传 API 🔥 NEW

```http
POST /api/upload/image   # 单图上传
POST /api/upload/images  # 多图上传（最多 9 张）
```

### 举报 API 🔥 NEW

```http
POST /api/reports        # 提交举报
GET  /api/reports        # 我的举报列表
```

---

## 📁 项目结构

```
lobster-circle-backend/
├── server.js           # 主服务器
├── package.json        # 依赖配置
├── .env               # 环境变量
├── models/            # 数据库模型
│   ├── User.js        # 用户
│   ├── Post.js        # 动态
│   ├── Message.js     # 消息
│   ├── FriendRequest.js # 好友请求
│   ├── Admin.js       # 管理员 🔥
│   ├── Report.js      # 举报 🔥
│   └── Notification.js # 通知 🔥
├── routes/            # API 路由
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── messages.js
│   ├── friends.js
│   ├── admin.js       # 后台管理 🔥
│   ├── upload.js      # 图片上传 🔥
│   └── reports.js     # 举报 🔥
├── middleware/
│   └── auth.js        # JWT 认证
└── uploads/           # 图片上传目录
```

---

## 🔧 数据库模型

### User（用户）
```javascript
{
  username: String,
  password: String,      // 加密
  avatar: String,
  bio: String,
  followers: [ObjectId],
  following: [ObjectId],
  friends: [ObjectId],
  isBanned: Boolean,     // 是否被封禁
  banReason: String,
  blockedUsers: [ObjectId]
}
```

### Admin（管理员） 🔥
```javascript
{
  username: String,
  password: String,      // 加密
  role: String,          // admin | super_admin
  permissions: {
    banUser: Boolean,
    deletePost: Boolean,
    viewStats: Boolean,
    manageAdmins: Boolean
  },
  lastLogin: Date
}
```

### Report（举报） 🔥
```javascript
{
  reporter: ObjectId,    // 举报人
  targetType: String,    // post | user | comment | message
  targetId: ObjectId,
  reason: String,        // spam | harassment | hate_speech | etc
  description: String,
  status: String,        // pending | reviewing | resolved | rejected
  handledBy: ObjectId,   // 处理的管理员
  handleNote: String
}
```

### Notification（通知） 🔥
```javascript
{
  userId: ObjectId,
  type: String,          // like | comment | follow | system | etc
  from: ObjectId,
  postId: ObjectId,
  message: String,
  read: Boolean,
  actionUrl: String
}
```

---

## 🎯 与前端集成

### 配置

```javascript
// config.js
export const API_BASE_URL = 'http://localhost:3000/api';
export const SOCKET_URL = 'http://localhost:3000';
```

### 认证请求

```javascript
// 登录
const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  AsyncStorage.setItem('token', data.token);
  return data;
};

// 带认证的请求
const getFeed = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/posts/feed`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

### 图片上传

```javascript
const uploadImages = async (uris) => {
  const formData = new FormData();
  uris.forEach((uri, index) => {
    formData.append('images', {
      uri: uri,
      name: `image_${index}.jpg`,
      type: 'image/jpeg',
    });
  });

  const response = await fetch(`${API_BASE_URL}/upload/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  return await response.json();
};
```

---

## 🔒 安全建议

1. **生产环境** 修改 `JWT_SECRET`
2. **启用 HTTPS**
3. **配置 CORS** 限制来源
4. **限流** 防止暴力请求
5. **输入验证** 防止注入攻击
6. **定期备份** 数据库
7. **管理员权限** 分级管理

---

## 🚀 部署

### 本地部署

1. 安装 MongoDB
2. 配置 `.env`
3. `npm start`

### 云端部署

**方案 A：Heroku + MongoDB Atlas**
```bash
heroku create lobster-circle-api
heroku addons:create mongolab:sandbox
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your-secret"
git push heroku main
```

**方案 B：阿里云/腾讯云 ECS**
- 购买服务器
- 安装 Node.js + MongoDB
- 使用 PM2 管理进程
```bash
npm install -g pm2
pm2 start server.js --name lobster-api
pm2 save
pm2 startup
```

---

## 📝 开发说明

### 添加新功能

1. 在 `models/` 创建数据模型
2. 在 `routes/` 创建 API 路由
3. 在 `server.js` 注册路由
4. 测试 API（使用 Postman 或 curl）

### 调试

```bash
# 查看详细日志
npm run dev

# 测试 API
curl http://localhost:3000/api/health

# 测试管理员登录
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🦞 关于

**版本**: 2.0.0 (企业版)  
**开发时间**: 2026-03-11  
**开发者**: 🦞 龙虾助手

---

**祝你使用愉快！** 🎉
