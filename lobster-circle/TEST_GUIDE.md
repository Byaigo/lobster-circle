# 🦞 龙虾圈 - 完整测试指南

## 📋 测试前准备

### 1. 环境要求

**必须安装：**
- [x] Node.js v16+ （[下载](https://nodejs.org/)）
- [x] MongoDB v5+ （[下载](https://www.mongodb.com/try/download/community)）
- [x] Git（可选，用于版本管理）

**可选安装：**
- [ ] Postman（API 测试）
- [ ] Expo Go（手机预览）

### 2. 检查清单

启动前请确认：
- [ ] Node.js 已安装（`node -v` 检查）
- [ ] MongoDB 已安装（`mongod --version` 检查）
- [ ] 端口 3000 未被占用
- [ ] 端口 19000-19003 未被占用（Expo）

---

## 🎯 第一步：启动 MongoDB

### Windows

**如果 MongoDB 已安装为服务：**
```bash
net start MongoDB
```

**如果未安装为服务：**
```bash
# 创建数据目录
mkdir C:\data\db

# 启动 MongoDB
mongod --dbpath "C:\data\db"
```

**验证：**
```bash
mongo --version
# 或
mongosh
```

看到 MongoDB shell 提示符说明成功！

---

## 🎯 第二步：启动后端

### 1. 进入后端目录
```bash
cd C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle-backend
```

### 2. 安装依赖
```bash
npm install
```

**预期输出：**
```
added 150 packages in 30s
```

### 3. 配置环境变量
编辑 `.env` 文件：
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lobster-circle
JWT_SECRET=lobster-circle-super-secret-key-2026
```

### 4. 启动后端服务器
```bash
# 开发模式（推荐，自动重启）
npm run dev

# 或生产模式
npm start
```

**预期输出：**
```
✅ MongoDB 连接成功
🦞 龙虾圈后端服务器运行在端口 3000
📡 WebSocket 已启用
🌐 http://localhost:3000
```

### 5. 验证后端
打开浏览器访问：
```
http://localhost:3000/api/health
```

**预期响应：**
```json
{
  "status": "ok",
  "message": "🦞 龙虾圈后端运行中"
}
```

---

## 🎯 第三步：初始化配置

### 使用 Postman 或 curl

**1. 创建管理员账号（首次使用）**

打开 MongoDB shell：
```bash
mongosh
```

执行：
```javascript
use lobster-circle

db.admins.insertOne({
  username: "admin",
  password: "$2a$10$XoJl.6XOzqG7kqN8h5qL9OYjKxN7VqN8h5qL9OYjKxN7VqN8h5qL9O", // admin123 的 bcrypt 哈希
  role: "super_admin",
  permissions: {
    banUser: true,
    deletePost: true,
    viewStats: true,
    manageAdmins: true
  },
  createdAt: new Date()
})
```

**2. 初始化系统配置**

```bash
curl -X POST http://localhost:3000/api/config/init \
  -H "Content-Type: application/json"
```

**预期响应：**
```json
{
  "message": "初始化完成，新增 14 个配置"
}
```

**3. 管理员登录**

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期响应：**
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "username": "admin",
    "role": "super_admin"
  }
}
```

**保存 token，后续请求需要用到！**

---

## 🎯 第四步：启动前端

### 1. 进入前端目录
```bash
cd C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle
```

### 2. 安装依赖
```bash
npm install
```

**预期输出：**
```
added 200 packages in 1min
```

### 3. 启动 Expo
```bash
npm start
```

**预期输出：**
```
┌────────────────────────────────────┐
│   Your app is running at:          │
│                                    │
│   ▸ Scan QR Code with Expo Go    │
│   ▸ http://localhost:19002       │
│                                    │
└────────────────────────────────────┘
```

### 4. 手机预览

**方式一：Expo Go（推荐）**
1. 手机下载 **Expo Go**（App Store / 应用商店）
2. 扫描终端显示的二维码
3. App 在手机上运行！

**方式二：安卓模拟器**
```bash
npm run android
```

**方式三：浏览器**
```bash
npm run web
```

---

## 🧪 第五步：功能测试

### 测试用例清单

#### 1. 用户认证 ✅
- [ ] 注册新用户
- [ ] 登录
- [ ] 登出
- [ ] Token 过期处理

#### 2. 动态功能 ✅
- [ ] 发布动态（文字）
- [ ] 发布动态（图片）
- [ ] 查看信息流
- [ ] 点赞动态
- [ ] 收藏动态
- [ ] 评论动态
- [ ] 删除自己的动态

#### 3. 好友系统 ✅
- [ ] 搜索用户
- [ ] 发送好友请求
- [ ] 接收好友请求
- [ ] 同意好友请求
- [ ] 拒绝好友请求
- [ ] 查看好友列表
- [ ] 删除好友

#### 4. 私信聊天 ✅
- [ ] 查看会话列表
- [ ] 发送消息
- [ ] 接收实时消息
- [ ] 查看聊天记录
- [ ] 消息已读回执

#### 5. 通知中心 ✅
- [ ] 收到点赞通知
- [ ] 收到评论通知
- [ ] 收到关注通知
- [ ] 标记为已读

#### 6. 个人主页 ✅
- [ ] 查看自己的主页
- [ ] 查看他人的主页
- [ ] 编辑个人简介
- [ ] 关注/取消关注
- [ ] 发送好友请求

#### 7. 后台管理 ✅
- [ ] 管理员登录
- [ ] 查看统计数据
- [ ] 查看用户列表
- [ ] 封禁/解封用户
- [ ] 查看动态列表
- [ ] 删除违规动态
- [ ] 查看举报列表
- [ ] 处理举报

#### 8. 功能开关 ✅
- [ ] 获取公开配置
- [ ] 更新配置（禁止发帖）
- [ ] 验证禁止发帖生效
- [ ] 恢复发帖功能
- [ ] 开启维护模式
- [ ] 验证维护模式生效

#### 9. 敏感词过滤 ✅
- [ ] 添加敏感词
- [ ] 发布包含敏感词的内容（应被阻止）
- [ ] 批量添加敏感词
- [ ] 删除敏感词
- [ ] 启用/禁用敏感词

#### 10. 图片上传 ✅
- [ ] 单图上传
- [ ] 多图上传（最多 9 张）
- [ ] 上传非图片文件（应失败）
- [ ] 上传超大文件（应失败）

---

## 🐛 常见问题排查

### 问题 1：MongoDB 连接失败

**错误：**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**解决：**
```bash
# 检查 MongoDB 是否运行
net start MongoDB

# 或手动启动
mongod --dbpath "C:\data\db"
```

### 问题 2：端口被占用

**错误：**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决：**
```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :3000

# 杀死进程
taskkill /PID <进程 ID> /F

# 或修改 .env 中的端口
PORT=3001
```

### 问题 3：npm install 失败

**错误：**
```
npm ERR! network timeout at: https://registry.npmjs.org/
```

**解决：**
```bash
# 切换淘宝镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### 问题 4：Expo 无法连接

**错误：**
```
Network response timed out
```

**解决：**
1. 确保手机和电脑在同一 WiFi
2. 使用隧道模式：`npx expo start --tunnel`
3. 检查防火墙设置

### 问题 5：图片上传失败

**错误：**
```
Error: ENOENT: no such file or directory, mkdir 'uploads'
```

**解决：**
```bash
# 手动创建 uploads 目录
mkdir uploads
```

---

## 📊 性能测试

### 1. API 响应时间测试

使用 Postman 或 wrk：
```bash
# 安装 wrk
# https://github.com/wg/wrk

# 测试信息流 API
wrk -t12 -c400 -d30s http://localhost:3000/api/posts/feed
```

**目标：**
- 平均响应时间 < 200ms
- 95% 响应时间 < 500ms
- 错误率 < 0.1%

### 2. 并发测试

**场景：** 100 个用户同时发帖

```bash
# 使用 Apache Bench
ab -n 100 -c 10 -p post.json -T application/json \
  http://localhost:3000/api/posts
```

### 3. 数据库性能

**检查索引：**
```javascript
// MongoDB shell
db.posts.getIndexes()
db.users.getIndexes()
```

**添加索引（如果需要）：**
```javascript
db.posts.createIndex({ userId: 1, createdAt: -1 })
db.messages.createIndex({ conversationId: 1, createdAt: -1 })
```

---

## ✅ 上线前检查清单

### 安全
- [ ] 修改 `JWT_SECRET` 为随机字符串
- [ ] 启用 HTTPS
- [ ] 配置 CORS 白名单
- [ ] 删除测试账号
- [ ] 配置防火墙

### 性能
- [ ] 数据库索引优化
- [ ] 启用 Redis 缓存（可选）
- [ ] 配置 CDN（图片）
- [ ] 开启 Gzip 压缩

### 监控
- [ ] 配置日志记录
- [ ] 配置错误监控（Sentry）
- [ ] 配置性能监控
- [ ] 配置告警通知

### 备份
- [ ] 配置数据库自动备份
- [ ] 配置文件备份
- [ ] 测试恢复流程

---

## 📞 获取帮助

**遇到问题？**

1. 查看日志：
   ```bash
   # 后端日志
   npm run dev
   
   # MongoDB 日志
   # Windows: C:\Program Files\MongoDB\Server\5.0\log
   ```

2. 检查代码：
   - 前端：`C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle\`
   - 后端：`C:\Users\Administrator\.openclaw\workspace\apps\lobster-circle-backend\`

3. 查看文档：
   - 前端 README
   - 后端 README
   - 企业功能说明
   - 功能开关说明

---

**祝你测试顺利！** 🎉

**版本**: 3.1.0  
**更新时间**: 2026-03-11  
**开发者**: 🦞 龙虾助手
