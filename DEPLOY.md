# 🦞 龙虾圈 - 部署指南

## 📋 目录

1. [手动部署](#手动部署)
2. [自动部署](#自动部署)
3. [服务器配置](#服务器配置)
4. [环境变量](#环境变量)
5. [常见问题](#常见问题)

---

## 🚀 手动部署

### 1. 服务器准备

**系统要求：**
- Ubuntu 20.04+ / CentOS 7+
- 2 核 CPU
- 4GB 内存
- 40GB 硬盘

**安装依赖：**
```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装 PM2
sudo npm install -g pm2
```

### 2. 克隆代码

```bash
cd /var/www
git clone https://github.com/Byaigo/lobster-circle.git
cd lobster-circle
```

### 3. 部署后端

```bash
cd lobster-circle-backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
vim .env  # 编辑配置

# 启动服务
pm2 start server.js --name lobster-api
pm2 save
pm2 startup
```

### 4. 部署后台管理

```bash
cd lobster-circle-admin

# 安装依赖
npm install --production

# 构建
npm run build

# 配置 Nginx
sudo vim /etc/nginx/sites-available/lobster-admin
```

**Nginx 配置：**
```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        root /var/www/lobster-circle/lobster-circle-admin/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/lobster-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. 部署前端（可选）

```bash
cd lobster-circle

# 安装依赖
npm install

# 构建 Web 版本
npx expo export --platform web

# 配置 Nginx（类似后台管理）
```

---

## 🔄 自动部署

### 配置 GitHub Actions

**1. 添加服务器密钥到 GitHub：**

进入仓库 Settings → Secrets and variables → Actions

添加以下密钥：
- `SERVER_HOST`: 服务器 IP
- `SERVER_USERNAME`: SSH 用户名
- `SERVER_SSH_KEY`: SSH 私钥
- `SERVER_PORT`: SSH 端口（默认 22）

**2. 生成 SSH 密钥：**

```bash
ssh-keygen -t ed25519 -C "github-actions"
```

**3. 添加公钥到服务器：**

```bash
cat ~/.ssh/id_ed25519.pub | ssh user@server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**4. 推送代码自动部署：**

```bash
git add .
git commit -m "feat: 添加新功能"
git push
```

GitHub Actions 会自动：
1. 运行测试
2. 构建代码
3. 部署到服务器
4. 重启服务

---

## 🔐 环境变量

### 后端 .env

```env
# 服务器配置
PORT=3000
NODE_ENV=production

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

# Redis 配置（可选）
REDIS_URL=redis://localhost:6379
```

### 前端配置

修改 `lobster-circle/config.js`：

```javascript
export const API_BASE_URL = 'https://api.yourdomain.com/api';
export const SOCKET_URL = 'https://api.yourdomain.com';
```

---

## ⚠️ 常见问题

### 1. MongoDB 连接失败

```bash
# 检查 MongoDB 状态
sudo systemctl status mongod

# 启动 MongoDB
sudo systemctl start mongod
```

### 2. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000

# 杀死进程
sudo kill -9 <PID>
```

### 3. PM2 服务异常

```bash
# 查看日志
pm2 logs lobster-api

# 重启服务
pm2 restart lobster-api

# 查看状态
pm2 status
```

### 4. Nginx 配置错误

```bash
# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx
```

### 5. 权限问题

```bash
# 修改文件权限
sudo chown -R www-data:www-data /var/www/lobster-circle
sudo chmod -R 755 /var/www/lobster-circle
```

---

## 📊 监控和维护

### 查看日志

```bash
# PM2 日志
pm2 logs

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB 日志
sudo tail -f /var/log/mongodb/mongod.log
```

### 性能监控

```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 备份数据库

```bash
# 备份
mongodump --out /backup/mongodb

# 恢复
mongorestore /backup/mongodb
```

---

## 🎯 部署检查清单

### 上线前
- [ ] 修改所有默认密码
- [ ] 配置 HTTPS
- [ ] 配置数据库备份
- [ ] 测试所有功能
- [ ] 压力测试
- [ ] 配置监控告警

### 上线后
- [ ] 监控服务器状态
- [ ] 定期检查日志
- [ ] 及时更新系统
- [ ] 收集用户反馈
- [ ] 持续优化性能

---

**祝你部署顺利！** 🎉

**版本**: 3.2.0  
**更新时间**: 2026-03-12  
**开发者**: 🦞 龙虾助手
