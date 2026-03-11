# 🦞 龙虾圈 - 上线部署清单

## ✅ 开发完成检查

- [x] 核心社交功能
- [x] 后台管理系统
- [x] 内容审核机制
- [x] 敏感词过滤
- [x] 功能开关系统
- [x] 推送通知集成
- [x] 云存储集成
- [x] 数据分析系统
- [x] 自动化测试
- [x] 完整文档

---

## 📋 上线前准备

### 1. 服务器准备

**推荐配置：**
- CPU: 2 核+
- 内存：4GB+
- 硬盘：40GB+
- 系统：Ubuntu 20.04 / CentOS 7+

**购买渠道：**
- 阿里云：https://www.aliyun.com/
- 腾讯云：https://cloud.tencent.com/
- 华为云：https://www.huaweicloud.com/

**预估成本：** ¥200-300/月

### 2. 域名购买

**推荐：**
- .com / .cn 域名
- 易记、与品牌相关

**购买渠道：**
- 阿里云万网
- 腾讯云 DNSPod

**预估成本：** ¥50-100/年

### 3. ICP 备案

**必须！** 国内服务器必须备案

**流程：**
1. 登录阿里云/腾讯云备案系统
2. 提交资料（营业执照/身份证）
3. 等待审核（7-20 天）
4. 备案成功后添加备案号到网站底部

**费用：** 免费

### 4. HTTPS 证书

**推荐使用 Let's Encrypt（免费）**

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**或使用阿里云 SSL 证书：**
- 免费版：1 年
- 付费版：¥1000+/年

### 5. MongoDB 数据库

**方案 A：自建（省钱）**
- 在服务器上安装 MongoDB
- 配置自动备份

**方案 B：云服务（省心）**
- MongoDB Atlas：https://www.mongodb.com/cloud/atlas
- 阿里云 MongoDB：https://www.aliyun.com/product/mongodb
- 免费额度：512MB-5GB
- 付费：¥100+/月

### 6. 云存储（七牛云）

**注册：** https://portal.qiniu.com/

**配置：**
1. 创建存储桶
2. 配置 CDN 加速
3. 绑定自定义域名
4. 配置 HTTPS

**费用：**
- 存储空间：¥0.12/GB/月
- 流量：¥0.21/GB
- 请求次数：¥0.01/万次

**预估：** ¥50-100/月（50GB 存储）

### 7. 推送服务（极光推送）

**注册：** https://www.jiguang.cn/

**配置：**
1. 创建应用
2. 获取 App Key 和 Master Secret
3. 配置到 `.env` 文件

**费用：** 免费版够用（100 万设备）

### 8. Redis 缓存（可选）

**安装：**
```bash
sudo apt-get install redis-server
sudo systemctl enable redis
```

**配置：**
- 修改密码
- 配置持久化
- 设置最大内存

---

## 🔧 服务器配置

### 1. 安装 Node.js

```bash
# 使用 NVM 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. 安装 PM2

```bash
npm install -g pm2
```

### 3. 部署后端

```bash
# 上传代码
cd /var/www/lobster-circle-backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
vim .env  # 修改配置

# 启动服务
pm2 start server.js --name lobster-api
pm2 save
pm2 startup
```

### 4. 部署后台管理

```bash
cd /var/www/lobster-circle-admin

# 构建
npm install
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
        root /var/www/lobster-circle-admin/build;
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

### 5. 配置 Nginx

```bash
sudo ln -s /etc/nginx/sites-available/lobster-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 安全配置

### 1. 防火墙

```bash
# 安装 UFW
sudo apt-get install ufw

# 允许 SSH
sudo ufw allow 22

# 允许 HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 启用防火墙
sudo ufw enable
```

### 2. SSH 安全

```bash
# 修改 SSH 端口
sudo vim /etc/ssh/sshd_config
# Port 2222

# 禁用密码登录
# PasswordAuthentication no

# 重启 SSH
sudo systemctl restart sshd
```

### 3. MongoDB 安全

```javascript
// 创建管理员用户
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password",
  roles: ["root"]
})

// 启用认证
// 修改 /etc/mongod.conf
security:
  authorization: "enabled"
```

### 4. 配置 .env

**生产环境必须修改：**
```env
JWT_SECRET=随机生成的强密码
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://:password@localhost:6379
QINIU_ACCESS_KEY=...
QINIU_SECRET_KEY=...
JPUSH_APP_KEY=...
JPUSH_MASTER_SECRET=...
```

---

## 📊 监控配置

### 1. 日志监控

```bash
# 查看 PM2 日志
pm2 logs lobster-api

# 实时查看
pm2 logs lobster-api --lines 100
```

### 2. 性能监控

**推荐工具：**
- PM2 Monitor: `pm2 monit`
- 阿里云监控
- 腾讯云监控

### 3. 错误监控

**推荐服务：**
- Sentry: https://sentry.io/
- 阿里云 ARMS

---

## 📱 App 上架

### 1. Android 上架

**应用商店：**
- 华为应用市场
- 小米应用商店
- OPPO 软件商店
- vivo 应用商店
- 应用宝（腾讯）

**准备材料：**
- APK 文件
- 应用图标（512x512）
- 应用截图（3-5 张）
- 应用描述
- 软件著作权（部分商店需要）

### 2. iOS 上架

**需要：**
- Apple Developer 账号（$99/年）
- Mac 电脑（用于打包）
- App Store Connect 账号

**流程：**
1. 在 App Store Connect 创建应用
2. 使用 Xcode 打包
3. 提交审核（3-7 天）
4. 上架

---

## 💰 成本预估

| 项目 | 费用 |
|------|------|
| 服务器（2 核 4G） | ¥200/月 |
| 域名 | ¥50/年 |
| MongoDB Atlas | ¥0-200/月 |
| 七牛云存储 | ¥50-100/月 |
| 极光推送 | ¥0（免费） |
| HTTPS 证书 | ¥0（Let's Encrypt） |
| **总计** | **¥300-550/月** |

---

## ✅ 上线检查清单

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

## 📞 技术支持

**遇到问题？**

1. 查看日志：`pm2 logs`
2. 查看文档：`README.md`
3. 重启服务：`pm2 restart all`

---

**祝你上线顺利！** 🎉

**版本**: 3.1.0  
**更新时间**: 2026-03-11  
**开发者**: 🦞 龙虾助手
