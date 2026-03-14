# 🦞 龙虾圈 - 部署指南

## 📋 目录

1. [Docker 部署（推荐）](#docker 部署推荐)
2. [手动部署](#手动部署)
3. [云平台部署](#云平台部署)
4. [常见问题](#常见问题)

---

## 🐳 Docker 部署（推荐）

### 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0

### 一键部署

```bash
# 克隆项目
git clone https://github.com/Byaigo/lobster-circle.git
cd lobster-circle

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env 修改配置

# 一键部署
chmod +x deploy.sh
./deploy.sh deploy
```

### 访问服务

- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health
- **MongoDB**: localhost:27017

### 常用命令

```bash
# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs

# 重启服务
./deploy.sh restart

# 停止服务
./deploy.sh stop

# 清理数据（危险！）
./deploy.sh clean
```

### 手动 Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

---

## 🖥️ 手动部署

### 1. 安装依赖

**Node.js** >= 16.x
```bash
# 使用 nvm（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**MongoDB** >= 6.0
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# macOS
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env`:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/lobster-circle

# 服务器
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-key-change-this

# CORS
CORS_ORIGIN=https://your-domain.com

# 七牛云（可选）
QINIU_ACCESS_KEY=xxx
QINIU_SECRET_KEY=xxx
QINIU_BUCKET=xxx
```

### 3. 初始化数据

```bash
cd backend
npm install
npm run init
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
NODE_ENV=production npm start

# 使用 PM2（推荐）
npm install -g pm2
pm2 start server.js --name lobster-backend
pm2 save
pm2 startup
```

### 5. 配置 Nginx（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
    }
}
```

---

## ☁️ 云平台部署

### Heroku

```bash
# 安装 Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 登录
heroku login

# 创建应用
heroku create lobster-circle-api

# 添加 MongoDB
heroku addons:create mongolab:sandbox

# 配置环境变量
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# 部署
git push heroku main

# 查看日志
heroku logs --tail
```

### 阿里云 ECS

```bash
# 1. 购买 ECS 实例（推荐 2 核 4G）
# 2. 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker
systemctl enable docker
systemctl start docker

# 3. 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.11.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 4. 部署项目
git clone https://github.com/Byaigo/lobster-circle.git
cd lobster-circle
./deploy.sh deploy

# 5. 配置安全组
# 开放端口：80, 443, 3000
```

### 腾讯云 Cloud Run

```bash
# 1. 构建并推送镜像
docker build -t ccr.ccs.tencentyun.com/your-namespace/lobster-backend:latest .
docker push ccr.ccs.tencentyun.com/your-namespace/lobster-backend:latest

# 2. 创建云函数
# 选择容器镜像
# 配置环境变量

# 3. 配置 API 网关
```

---

## 🔧 常见问题

### Q: MongoDB 连接失败
A: 检查 MongoDB 服务是否启动，确认 `MONGODB_URI` 配置正确。

### Q: 端口被占用
A: 修改 `.env` 中的 `PORT` 或使用不同端口启动。

### Q: Docker 构建失败
A: 确保网络畅通，或配置 Docker 镜像加速器。

### Q: 内存不足
A: MongoDB 推荐 1G 以上内存，建议服务器配置 2 核 4G。

### Q: 如何备份数据
A: 
```bash
# MongoDB 备份
mongodump --uri="mongodb://localhost:27017/lobster-circle" --out=./backup

# MongoDB 恢复
mongorestore --uri="mongodb://localhost:27017/lobster-circle" ./backup
```

### Q: 如何查看日志
A:
```bash
# Docker 部署
docker-compose logs -f backend

# PM2 部署
pm2 logs lobster-backend

# 直接查看
tail -f ~/.pm2/logs/lobster-backend-out.log
```

---

## 📊 性能优化

### 生产环境建议

1. **启用 HTTPS**
   ```bash
   # 使用 Let's Encrypt
   certbot --nginx -d your-domain.com
   ```

2. **配置 CDN**
   - 七牛云/阿里云 OSS 存储静态资源
   - Cloudflare 加速全球访问

3. **数据库优化**
   ```javascript
   // 添加索引
   db.users.createIndex({ username: 1 })
   db.posts.createIndex({ author: 1, createdAt: -1 })
   db.posts.createIndex({ location: "2dsphere" })
   ```

4. **启用缓存**
   - Redis 缓存热点数据
   - 配置 Nginx 静态缓存

5. **负载均衡**
   - 多实例部署
   - Nginx 反向代理

---

## 📞 技术支持

- **GitHub Issues**: https://github.com/Byaigo/lobster-circle/issues
- **文档**: https://github.com/Byaigo/lobster-circle/blob/main/docs/DOCUMENTATION.md

---

**祝你部署顺利！** 🦞
