# 🦞 龙虾圈 - 生产环境部署指南

## 📋 部署前检查清单

### 1. 服务器要求

| 配置 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核 | 4 核 |
| 内存 | 4GB | 8GB |
| 存储 | 20GB | 50GB SSD |
| 系统 | Ubuntu 20.04+ | Ubuntu 22.04 LTS |
| Node.js | 18+ | 20+ |
| MongoDB | 5.0+ | 6.0+ |

---

## 2. 环境准备

### 2.1 安装 Node.js
```bash
# 使用 nvm 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20

# 验证
node -v  # 应显示 v20.x.x
npm -v   # 应显示 10.x.x
```

### 2.2 安装 MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证
mongod --version
```

### 2.3 安装 Redis（可选，用于缓存）
```bash
sudo apt-get install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 2.4 安装 PM2（进程管理）
```bash
sudo npm install -g pm2
pm2 version
```

### 2.5 安装 Git
```bash
sudo apt-get install -y git
git --version
```

---

## 3. 代码部署

### 3.1 克隆代码
```bash
cd /var/www
git clone https://github.com/Byaigo/lobster-circle.git
cd lobster-circle
```

### 3.2 部署后端

```bash
# 进入后端目录
cd lobster-circle-backend

# 安装依赖
npm install --production

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件
nano .env
```

**配置 `.env`：**
```env
# 服务器配置
PORT=3000
NODE_ENV=production

# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/lobster-circle

# JWT 配置
JWT_SECRET=生成一个强随机密钥（至少 32 字符）
JWT_EXPIRE=7d

# 文件上传配置
UPLOAD_PATH=/var/www/lobster-circle/lobster-circle-backend/uploads
MAX_FILE_SIZE=10485760

# 跨域配置
CORS_ORIGIN=*

# Redis 配置（可选）
REDIS_URL=redis://localhost:6379

# 七牛云配置
QINIU_ACCESS_KEY=你的 AccessKey
QINIU_SECRET_KEY=你的 SecretKey
QINIU_BUCKET=lobster-circle
QINIU_DOMAIN=https://your-cdn-domain.com

# 极光推送配置
JPUSH_APP_KEY=你的 AppKey
JPUSH_MASTER_SECRET=你的 MasterSecret
```

**生成 JWT 密钥：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 初始化数据

```bash
# 初始化管理员账号
npm run init:admin
# 默认账号：admin / admin123

# 初始化配置
npm run init:config
```

### 3.4 启动后端（PM2）

```bash
# 启动服务
pm2 start server.js --name lobster-api

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 按提示执行生成的命令
```

### 3.5 部署后台管理

```bash
# 进入后台目录
cd /var/www/lobster-circle/lobster-circle-admin

# 安装依赖
npm install

# 构建
npm run build

# 使用 PM2 启动（需要配置 serve）
npm install -g serve
pm2 start serve --name lobster-admin -- "build -s -l 3001"
```

### 3.6 配置 Nginx 反向代理

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/lobster-circle
```

**Nginx 配置：**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后台管理
    location /admin/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件
    location /uploads/ {
        alias /var/www/lobster-circle/lobster-circle-backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**启用配置：**
```bash
sudo ln -s /etc/nginx/sites-available/lobster-circle /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3.7 配置 HTTPS（Let's Encrypt）

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 4. 数据库备份

### 4.1 手动备份
```bash
mongodump --uri="mongodb://localhost:27017/lobster-circle" --out=/backup/mongodb/$(date +%Y%m%d)
```

### 4.2 自动备份（Cron）

创建备份脚本 `/var/www/lobster-circle/backup.sh`：
```bash
#!/bin/bash
BACKUP_DIR="/backup/mongodb/$(date +%Y%m%d_%H%M%S)"
mongodump --uri="mongodb://localhost:27017/lobster-circle" --out=$BACKUP_DIR
echo "备份完成：$BACKUP_DIR"

# 删除 7 天前的备份
find /backup/mongodb -type d -mtime +7 -exec rm -rf {} \;
```

设置权限和定时任务：
```bash
chmod +x /var/www/lobster-circle/backup.sh
crontab -e
# 添加：每天凌晨 2 点备份
0 2 * * * /var/www/lobster-circle/backup.sh
```

---

## 5. 监控和日志

### 5.1 PM2 监控
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs lobster-api

# 查看详细信息
pm2 show lobster-api

# 重启服务
pm2 restart lobster-api

# 查看内存使用
pm2 monit
```

### 5.2 系统监控
```bash
# 安装 htop
sudo apt-get install -y htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 6. 安全加固

### 6.1 防火墙配置
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 6.2 MongoDB 安全
```bash
# 启用认证
sudo nano /etc/mongod.conf
# 添加：
security:
  authorization: enabled

# 重启 MongoDB
sudo systemctl restart mongod

# 创建数据库用户
mongosh
use lobster-circle
db.createUser({
  user: "lobster_user",
  pwd: "强密码",
  roles: [{ role: "readWrite", db: "lobster-circle" }]
})
```

### 6.3 定期更新
```bash
# 系统更新
sudo apt-get update
sudo apt-get upgrade -y

# 检查 npm 安全漏洞
cd /var/www/lobster-circle/lobster-circle-backend
npm audit
npm audit fix
```

---

## 7. 性能优化

### 7.1 MongoDB 索引
```bash
# 登录 MongoDB
mongosh

# 创建索引
use lobster-circle
db.users.createIndex({ username: 1 })
db.posts.createIndex({ userId: 1, createdAt: -1 })
db.posts.createIndex({ hashtags: 1 })
db.posts.createIndex({ content: "text" })
```

### 7.2 Redis 缓存
在 `.env` 中配置：
```env
REDIS_URL=redis://localhost:6379
```

### 7.3 CDN 配置
- 七牛云 CDN 已在 `.env` 中配置
- 静态资源（图片）自动走 CDN

---

## 8. 故障排查

### 8.1 后端无法启动
```bash
# 查看 PM2 日志
pm2 logs lobster-api --lines 100

# 检查端口占用
lsof -i :3000

# 检查 MongoDB 连接
mongosh --eval "db.runCommand('ping')"
```

### 8.2 数据库连接失败
```bash
# 检查 MongoDB 状态
sudo systemctl status mongod

# 重启 MongoDB
sudo systemctl restart mongod
```

### 8.3 Nginx 报错
```bash
# 检查配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

---

## 9. 一键更新（后台管理）

### 使用后台管理系统的更新功能：

1. 登录后台：`https://your-domain.com/admin`
2. 进入 **版本管理** 页面
3. 点击 **检查更新**
4. 如有新版本，点击 **一键更新**

**或手动更新：**
```bash
cd /var/www/lobster-circle
git pull origin master
cd lobster-circle-backend
npm install --production
pm2 restart lobster-api
```

---

## 10. 上线验证

### 检查清单：
- [ ] 后端 API 可访问：`https://your-domain.com/api/health`
- [ ] 后台管理可访问：`https://your-domain.com/admin`
- [ ] 图片上传正常
- [ ] 用户注册/登录正常
- [ ] 发布动态正常
- [ ] 点赞/评论正常
- [ ] 好友系统正常
- [ ] 私信聊天正常
- [ ] 推送通知正常
- [ ] 数据库备份正常

---

## 📞 技术支持

遇到问题？
- GitHub Issues: https://github.com/Byaigo/lobster-circle/issues
- 文档：https://github.com/Byaigo/lobster-circle/tree/main/docs

---

**祝你部署顺利！🦞**
