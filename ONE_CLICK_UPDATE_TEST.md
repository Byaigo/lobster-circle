# 🦞 一键更新功能测试指南

## 功能说明

龙虾圈后台管理系统支持**一键更新**功能，管理员可以通过后台检查并自动更新到最新版本。

---

## 测试步骤

### 1. 启动后端服务

```bash
cd lobster-circle-backend
npm run dev
```

### 2. 登录后台管理

- 地址：http://localhost:3001/admin
- 账号：`admin`
- 密码：`admin123`

### 3. 进入版本管理页面

点击左侧菜单 **版本管理**

### 4. 检查更新

点击 **检查更新** 按钮

**预期响应：**
```json
{
  "currentVersion": "3.1.0",
  "latestVersion": {
    "version": "3.2.0",
    "name": "v3.2.0",
    "publishedAt": "2026-03-12T10:45:00Z",
    "url": "https://github.com/Byaigo/lobster-circle/releases/latest",
    "body": "更新内容..."
  },
  "hasUpdate": true
}
```

### 5. 一键更新

点击 **立即更新** 按钮

**后端执行流程：**
1. `git pull origin master` - 拉取最新代码
2. `npm install --production` - 安装依赖
3. `npm run build` - 构建后台管理
4. `pm2 restart lobster-api && pm2 restart lobster-admin` - 重启服务

---

## API 接口

### 检查更新
```http
GET /api/version/check
Authorization: Bearer <admin_token>
```

**响应：**
```json
{
  "currentVersion": "3.1.0",
  "latestVersion": {
    "version": "3.2.0",
    "name": "v3.2.0",
    "publishedAt": "2026-03-12T10:45:00Z",
    "url": "https://github.com/Byaigo/lobster-circle/releases/latest",
    "body": "更新内容..."
  },
  "hasUpdate": true
}
```

### 拉取代码
```http
POST /api/version/pull
Authorization: Bearer <admin_token>
```

### 安装依赖
```http
POST /api/version/install
Authorization: Bearer <admin_token>
```

### 构建项目
```http
POST /api/version/build
Authorization: Bearer <admin_token>
```

### 重启服务
```http
POST /api/version/restart
Authorization: Bearer <admin_token>
```

---

## 注意事项

### 1. 权限要求
- 仅管理员账号可使用更新功能
- 需要 Git 权限（已配置 SSH Key 或 Token）

### 2. 依赖要求
- Git 已安装并配置
- Node.js 18+ 已安装
- PM2 已安装并配置服务

### 3. 网络要求
- 可访问 GitHub（或私有 Git 服务器）
- 可访问 npm 仓库

### 4. 安全建议
- 生产环境建议禁用自动重启
- 更新前先备份数据库
- 更新前通知用户维护时间

---

## 故障排查

### 问题：检查更新失败
**原因：** GitHub 无法访问  
**解决：** 检查网络连接，或配置 GitHub 镜像

### 问题：拉取代码失败
**原因：** Git 权限不足  
**解决：** 配置 SSH Key 或 Git Token

### 问题：安装依赖失败
**原因：** npm 网络问题  
**解决：** 配置淘宝镜像 `npm config set registry https://registry.npmmirror.com`

### 问题：重启服务失败
**原因：** PM2 未安装或服务未配置  
**解决：** 安装 PM2 并配置服务 `pm2 start server.js --name lobster-api`

---

## 手动更新（备选方案）

如果一键更新失败，可手动执行：

```bash
cd /var/www/lobster-circle

# 拉取代码
git pull origin master

# 安装依赖
cd lobster-circle-backend
npm install --production

cd ../lobster-circle-admin
npm install
npm run build

# 重启服务
pm2 restart lobster-api
pm2 restart lobster-admin
```

---

## 更新日志

查看最新版本信息：
https://github.com/Byaigo/lobster-circle/releases

---

**祝你测试顺利！** 🦞
