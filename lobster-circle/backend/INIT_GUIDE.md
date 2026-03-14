# 🦞 龙虾圈后端 - 初始化指南

## 快速开始

### 1. 安装依赖

```bash
cd apps/lobster-circle/backend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/lobster-circle

# 服务器
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# JWT
JWT_SECRET=your-super-secret-key-change-this

# 七牛云（可选）
QINIU_ACCESS_KEY=xxx
QINIU_SECRET_KEY=xxx
QINIU_BUCKET=xxx
```

### 3. 初始化数据

运行初始化脚本，创建默认主题、头像框、成就等：

```bash
# 方法 1：使用 npm 脚本
npm run init

# 方法 2：直接运行
node scripts/init-data.js
```

初始化内容：
- ✅ 6 套主题（包含 2 套 VIP 主题）
- ✅ 6 个头像框（包含稀有/史诗/传说）
- ✅ 6 张封面图（自然/城市/抽象）
- ✅ 7 个成就徽章
- ✅ 1 个每日抽奖活动

### 4. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 运行

### 5. 健康检查

访问：`http://localhost:3000/health`

返回：
```json
{
  "status": "ok",
  "timestamp": "2026-03-14T10:00:00.000Z",
  "uptime": 123.456
}
```

---

## 数据库说明

### MongoDB 本地安装

**Windows:**
```bash
# 下载安装 MongoDB Community Server
# https://www.mongodb.com/try/download/community

# 启动服务
net start MongoDB
```

**macOS:**
```bash
# 使用 Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
# 参考官方文档
# https://docs.mongodb.com/manual/administration/install-on-linux/
```

### MongoDB Atlas（云端免费）

1. 访问 https://www.mongodb.com/cloud/atlas
2. 创建免费集群（512MB）
3. 获取连接字符串
4. 更新 `.env` 中的 `MONGODB_URI`

---

## 验证初始化

### 检查主题

```javascript
// 在 MongoDB Shell 中执行
use lobster-circle
db.themes.find().pretty()
```

应该看到 6 个主题：
- 龙虾红 (default)
- 深海蓝 (ocean-blue)
- 翡翠绿 (emerald-green)
- 暗夜黑 (dark-night)
- 樱花粉 (sakura-pink) - VIP
- 至尊金 (premium-gold) - VIP

### 检查头像框

```javascript
db.avatarframes.find().pretty()
```

应该看到 6 个头像框。

### 检查成就

```javascript
db.achievements.find().pretty()
```

应该看到 7 个成就徽章。

---

## 常见问题

### Q: 初始化失败 "MongoDB 连接失败"
A: 确保 MongoDB 服务已启动，或检查 `MONGODB_URI` 配置是否正确。

### Q: 数据重复怎么办？
A: 初始化脚本使用 `findOneAndUpdate` + `upsert`，不会重复创建。如需重置，手动清空集合：
```javascript
db.themes.deleteMany({})
db.avatarframes.deleteMany({})
db.covers.deleteMany({})
db.achievements.deleteMany({})
db.lotteries.deleteMany({})
```

### Q: 如何添加新主题？
A: 在 `scripts/init-data.js` 的 `defaultThemes` 数组中添加新主题配置，然后重新运行 `npm run init`。

---

## 下一步

初始化完成后，可以：

1. **启动后端服务器** - `npm start`
2. **配置前端** - 修改 `apps/lobster-circle/config.js`
3. **启动前端** - `cd apps/lobster-circle && npm start`
4. **测试功能** - 注册账号，体验完整功能

---

**祝你使用愉快！** 🦞
