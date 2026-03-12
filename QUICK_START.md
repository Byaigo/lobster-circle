# 🦞 龙虾圈 - 快速启动指南

**5 分钟快速体验龙虾圈！**

---

## 🚀 快速启动（开发环境）

### 1. 克隆代码

```bash
git clone https://github.com/Byaigo/lobster-circle.git
cd lobster-circle
```

### 2. 启动后端

```bash
cd lobster-circle-backend

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env

# 初始化管理员账号
npm run init:admin

# 启动服务
npm run dev
```

**后端运行在：** http://localhost:3000

### 3. 启动后台管理

```bash
cd lobster-circle-admin

# 安装依赖
npm install

# 启动
npm start
```

**后台管理运行在：** http://localhost:3001

**登录账号：** `admin` / `admin123`

### 4. 启动前端 App

```bash
cd lobster-circle

# 安装依赖
npm install

# 启动
npm start
```

**扫描二维码** 在 Expo Go 中预览

---

## 📱 功能体验

### 必体验功能

1. **注册/登录** - 创建账号
2. **发布动态** - 发一条带图片的动态
3. **点赞评论** - 与他人互动
4. **每日签到** - 领取积分
5. **积分商城** - 兑换礼品
6. **好友系统** - 添加好友
7. **私信聊天** - 实时聊天

---

## ⚙️ 可选配置

### 七牛云 CDN（图片上传）

在 `lobster-circle-backend/.env` 配置：

```env
QINIU_ACCESS_KEY=你的 AccessKey
QINIU_SECRET_KEY=你的 SecretKey
QINIU_BUCKET=lobster-circle
QINIU_DOMAIN=https://your-cdn-domain.com
```

**注册地址：** https://www.qiniu.com

### 极光推送（消息推送）

在 `lobster-circle-backend/.env` 配置：

```env
JPUSH_APP_KEY=你的 AppKey
JPUSH_MASTER_SECRET=你的 MasterSecret
```

**注册地址：** https://www.jiguang.cn

---

## 📚 更多文档

- **完整部署：** `DEPLOY_PRODUCTION.md`
- **测试指南：** `TESTING_GUIDE.md`
- **项目状态：** `PROJECT_STATUS.md`
- **七牛云配置：** `QINIU_SETUP.md`

---

## 🆘 遇到问题？

### 后端启动失败

```bash
# 检查 MongoDB 是否运行
mongod --version

# 检查端口是否占用
lsof -i :3000
```

### 前端启动失败

```bash
# 清除缓存
npm start -- --clear

# 重新安装依赖
rm -rf node_modules && npm install
```

### GitHub Issues

https://github.com/Byaigo/lobster-circle/issues

---

**祝你使用愉快！** 🦞
