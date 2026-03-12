# 🦞 龙虾圈 - 常见问题解答

**更新时间：** 2026-03-12 23:30

---

## 📌 安装部署

### Q: 后端启动失败，提示 MongoDB 连接错误

**A:** 检查 MongoDB 是否运行：
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

或者修改 `.env` 使用 MongoDB Atlas：
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lobster-circle
```

### Q: 前端启动后看不到图片

**A:** 检查七牛云配置：
1. 确认 `.env` 中 `QINIU_*` 配置正确
2. 检查 Bucket 是否为公开读
3. 确认 CDN 域名可访问

### Q: 后台管理页面空白

**A:** 
1. 清除浏览器缓存
2. 检查控制台是否有报错
3. 确认后端服务已启动

---

## 🔐 账号安全

### Q: 忘记密码怎么办？

**A:** 
1. 点击登录页"忘记密码"
2. 输入注册邮箱
3. 查收邮件，点击重置链接
4. 设置新密码

### Q: 如何修改用户名？

**A:** 目前不支持修改用户名，请谨慎注册。

### Q: 账号被封禁了怎么办？

**A:** 联系管理员申诉，邮箱：admin@lobster-circle.com

---

## 📱 功能使用

### Q: 如何发布带图片的动态？

**A:** 
1. 点击首页"+"按钮
2. 输入文字内容
3. 点击"选择图片"
4. 选择照片后点击"发布"

### Q: 签到积分有什么用？

**A:** 积分可以在积分商城兑换礼品，如：
- 龙虾圈定制 T 恤（500 积分）
- 龙虾圈徽章（200 积分）
- 积分抵扣券（1000 积分）

### Q: 如何删除好友？

**A:** 
1. 进入"好友"页面
2. 找到要删除的好友
3. 点击右上角"..."
4. 选择"删除好友"

### Q: 私信聊天是实时的吗？

**A:** 是的，使用 Socket.io 实现实时通信，消息秒到。

---

## 🔧 技术相关

### Q: 支持哪些平台？

**A:** 
- **iOS:** 14.0+
- **Android:** 10.0+
- **Web:** 现代浏览器（Chrome/Firefox/Safari）

### Q: 数据保存在哪里？

**A:** 
- 开发环境：本地 MongoDB
- 生产环境：MongoDB Atlas 或自建 MongoDB
- 图片：七牛云 CDN

### Q: 支持离线使用吗？

**A:** 部分支持。可以浏览缓存的内容，但发布动态、聊天等功能需要网络。

### Q: 如何备份数据？

**A:** 
```bash
# MongoDB 备份
mongodump --uri="mongodb://localhost:27017/lobster-circle" --out=./backup

# MongoDB 恢复
mongorestore --uri="mongodb://localhost:27017/lobster-circle" ./backup
```

---

## 💰 积分商城

### Q: 积分怎么获得？

**A:** 
- 每日签到：10-50 积分
- 连续签到奖励：7 天 20 分，14 天 30 分，30 天 50 分
- 活动奖励：不定期活动

### Q: 积分会过期吗？

**A:** 积分永久有效，不会过期。

### Q: 兑换的商品多久发货？

**A:** 3-5 个工作日内发货，包邮。

---

## 🛡️ 隐私安全

### Q: 我的数据安全吗？

**A:** 
- 密码使用 bcrypt 加密存储
- 通信使用 HTTPS 加密
- 定期安全审计
- 不向第三方出售数据

### Q: 如何保护隐私？

**A:** 
- 设置 → 隐私设置 → 调整可见范围
- 可以拉黑骚扰用户
- 可以举报违规内容

### Q: 如何注销账号？

**A:** 
1. 设置 → 账号安全 → 注销账号
2. 确认注销
3. 账号将被软删除，30 天后彻底删除

---

## 📞 联系客服

### Q: 如何联系官方？

**A:** 
- **邮箱:** support@lobster-circle.com
- **GitHub:** https://github.com/Byaigo/lobster-circle/issues
- **反馈:** App 内 → 设置 → 用户反馈

### Q: 如何报告 Bug？

**A:** 
1. 打开 GitHub Issues
2. 点击"New Issue"
3. 选择"Bug Report"
4. 填写详细信息
5. 提交

### Q: 如何提交功能建议？

**A:** 
1. 打开 GitHub Issues
2. 点击"New Issue"
3. 选择"Feature Request"
4. 描述功能需求
5. 提交

---

## 🔄 更新升级

### Q: 如何更新到最新版本？

**A:** 
**自动更新（推荐）：**
1. 后台管理 → 版本管理
2. 点击"检查更新"
3. 点击"一键更新"

**手动更新：**
```bash
cd lobster-circle
git pull origin master
npm install
npm run build
```

### Q: 更新会丢失数据吗？

**A:** 不会。更新只更新代码，数据独立存储。

---

## 💡 其他

### Q: 龙虾圈是什么意思？

**A:** 龙虾圈是一个社交 App 的名字，寓意像龙虾一样坚硬的外壳保护用户的隐私，同时有温暖的内心连接每个人。

### Q: 可以商用吗？

**A:** 可以。本项目采用 MIT 许可证，允许商用。

### Q: 如何贡献代码？

**A:** 
1. Fork 项目
2. 创建分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

**还有其他问题？** 欢迎在 GitHub Issues 提问！🦞
