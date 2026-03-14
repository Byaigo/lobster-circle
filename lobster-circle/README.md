# 🦞 龙虾圈 - Lobster Circle

> 一个功能完整的社交 App - React Native + Node.js + MongoDB

[![Version](https://img.shields.io/badge/version-3.7.0-ff6b6b.svg)](https://github.com/Byaigo/lobster-circle)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

**📱 平台**: iOS / Android / Web  
**🔗 仓库**: https://github.com/Byaigo/lobster-circle  
**📅 更新**: 2026-03-14  
**👨‍💻 开发者**: Byaigo

---

## 📖 简介

龙虾圈是一个功能完整的社交应用，提供动态发布、好友聊天、群组互动、附近的人等核心社交功能，同时包含等级系统、成就徽章、幸运抽奖等娱乐功能，以及隐私设置、数据导出等工具功能。

**愿景**: 让社交更有趣！

---

## ✨ 功能特性（27 个新功能）

### 🎯 社交核心

| 功能 | 描述 | 状态 |
|------|------|------|
| 附近的人 | 基于地理位置发现附近用户 | ✅ |
| 群组系统 | 创建/加入群组，群聊功能 | ✅ |
| 访客记录 | 查看谁访问了你的主页 | ✅ |
| 好友系统 | 添加/管理好友 | ✅ |
| 私信聊天 | 实时一对一聊天 | ✅ |
| 动态发布 | 发布文字/图片/视频动态 | ✅ |

### 📝 内容互动

| 功能 | 描述 | 状态 |
|------|------|------|
| 投票系统 | 创建投票，多选/单选/匿名 | ✅ |
| 草稿箱 | 自动保存未发布内容 | ✅ |
| 点赞评论 | 完整互动系统 | ✅ |
| 图片上传 | 七牛云 CDN 集成 | ✅ |
| 话题标签 | #话题# 系统 | ✅ |
| 搜索功能 | 用户/动态/话题搜索 | ✅ |

### 🎨 个性化

| 功能 | 描述 | 状态 |
|------|------|------|
| 主题皮肤 | 多套配色方案（浅色/深色/VIP） | ✅ |
| 头像框 | 成就装饰系统 | ✅ |
| 封面图 | 个人主页背景定制 | ✅ |
| 等级系统 | 100 级经验值体系 | ✅ |
| 成就徽章 | 任务成就系统 | ✅ |
| 个人主页 | 完整资料展示 | ✅ |

### 🎰 娱乐运营

| 功能 | 描述 | 状态 |
|------|------|------|
| 幸运抽奖 | 积分抽奖活动 | ✅ |
| 签到系统 | 连续签到奖励 | ✅ |
| 积分商城 | 积分兑换商品 | ✅ |
| 通知中心 | 统一管理通知 | ✅ |
| 反馈系统 | 用户反馈收集 | ✅ |

### 🛠️ 工具安全

| 功能 | 描述 | 状态 |
|------|------|------|
| 隐私设置 | 精细化权限控制 | ✅ |
| 消息免打扰 | 分时段/分用户静音 | ✅ |
| 数据导出 | 导出个人全部数据 | ✅ |
| 黑名单管理 | 屏蔽骚扰用户 | ✅ |

---

## 🚀 快速开始

### 前置要求

- **Node.js** >= 16.x ([下载](https://nodejs.org/))
- **MongoDB** >= 4.0 ([下载](https://www.mongodb.com/try/download/community))
- **npm** >= 8.x

### 1️⃣ 克隆项目

```bash
git clone https://github.com/Byaigo/lobster-circle.git
cd lobster-circle
```

### 2️⃣ 配置后端

```bash
cd apps/lobster-circle/backend

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env

# 编辑 .env 配置 MongoDB URI 等
```

**.env 配置示例**:
```env
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

### 3️⃣ 启动后端

```bash
# 确保 MongoDB 已启动
# Windows: net start MongoDB
# macOS: brew services start mongodb-community

# 启动后端服务器
npm start
```

后端将在 `http://localhost:3000` 运行

### 4️⃣ 配置前端

```bash
cd apps/lobster-circle

# 安装依赖
npm install
```

**配置 API 地址** (`config.js`):
```javascript
export const API_BASE_URL = 'http://localhost:3000/api';
export const SOCKET_URL = 'http://localhost:3000';
```

### 5️⃣ 启动前端

```bash
# 启动 Expo 开发服务器
npm start

# 手机下载 Expo Go，扫描二维码
# 或在浏览器中打开
```

---

## 📁 项目结构

```
lobster-circle/
├── apps/
│   ├── lobster-circle/          # 前端 React Native 应用
│   │   ├── App.js               # 主应用入口
│   │   ├── api.js               # API 客户端
│   │   ├── socket.js            # Socket.io 客户端
│   │   ├── config.js            # 配置文件
│   │   ├── screens/             # 页面组件
│   │   │   ├── NearbyScreen.js  # 附近的人
│   │   │   ├── GroupsScreen.js  # 群组列表
│   │   │   ├── VisitorsScreen.js # 访客记录
│   │   │   ├── DraftBoxScreen.js # 草稿箱
│   │   │   ├── ThemeSelectorScreen.js # 主题选择
│   │   │   └── ...
│   │   ├── components/          # 通用组件
│   │   │   └── PollCreator.js   # 投票创建
│   │   ├── services/            # 服务层
│   │   ├── utils/               # 工具函数
│   │   └── package.json
│   │
│   └── lobster-circle-backend/  # 后端 Node.js 应用
│       ├── server.js            # 服务器入口
│       ├── models/              # 数据模型
│       │   ├── User.js          # 用户
│       │   ├── UserLevel.js     # 等级
│       │   ├── PrivacySettings.js # 隐私设置
│       │   ├── DndSettings.js   # 免打扰
│       │   ├── DataExport.js    # 数据导出
│       │   ├── Group.js         # 群组
│       │   ├── GroupMessage.js  # 群消息
│       │   ├── VisitRecord.js   # 访客记录
│       │   ├── Poll.js          # 投票
│       │   ├── Draft.js         # 草稿
│       │   ├── Theme.js         # 主题
│       │   ├── AvatarFrame.js   # 头像框
│       │   ├── Cover.js         # 封面图
│       │   ├── Achievement.js   # 成就
│       │   └── Lottery.js       # 抽奖
│       ├── routes/              # API 路由
│       │   ├── auth.js          # 认证
│       │   ├── users.js         # 用户
│       │   ├── posts.js         # 动态
│       │   ├── nearby.js        # 附近的人
│       │   ├── groups.js        # 群组
│       │   ├── visitors.js      # 访客
│       │   ├── polls.js         # 投票
│       │   ├── drafts.js        # 草稿
│       │   ├── customize.js     # 个性化
│       │   ├── entertainment.js # 娱乐
│       │   └── tools.js         # 工具
│       ├── middleware/          # 中间件
│       │   └── auth.js          # JWT 认证
│       ├── .env                 # 环境变量
│       └── package.json
│
├── docs/                        # 文档
│   ├── DOCUMENTATION.md         # 完整功能文档
│   ├── RELEASE_NOTES_v3.3.0.md  # 版本更新日志
│   └── ...
│
└── README.md                    # 本文件
```

---

## 📡 API 接口

### 认证模块 `/api/auth`
- `POST /register` - 注册
- `POST /login` - 登录
- `POST /logout` - 登出
- `GET /me` - 获取当前用户

### 社交功能
- `/api/nearby/*` - 附近的人
- `/api/groups/*` - 群组系统
- `/api/visitors/*` - 访客记录
- `/api/friends/*` - 好友系统

### 内容互动
- `/api/posts/*` - 动态管理
- `/api/polls/*` - 投票系统
- `/api/drafts/*` - 草稿箱

### 个性化
- `/api/customize/*` - 主题/头像框/封面图
- `/api/level/*` - 等级系统
- `/api/achievements/*` - 成就系统

### 娱乐运营
- `/api/lottery/*` - 幸运抽奖
- `/api/checkin/*` - 签到系统
- `/api/mall/*` - 积分商城

### 工具安全
- `/api/tools/privacy/*` - 隐私设置
- `/api/tools/dnd/*` - 免打扰
- `/api/tools/data-export/*` - 数据导出

完整 API 文档请查看 [DOCUMENTATION.md](docs/DOCUMENTATION.md)

---

## 🛠️ 技术栈

### 前端
| 技术 | 用途 |
|------|------|
| React Native | 跨平台框架 |
| Expo | 开发工具链 |
| React Navigation | 路由导航 |
| Socket.io Client | 实时通信 |
| AsyncStorage | 本地存储 |
| Axios | HTTP 客户端 |

### 后端
| 技术 | 用途 |
|------|------|
| Node.js | 运行时 |
| Express | Web 框架 |
| Socket.io | WebSocket |
| MongoDB | 数据库 |
| Mongoose | ODM |
| JWT | 认证 |
| bcryptjs | 密码加密 |
| Helmet | 安全头盔 |

---

## 📊 项目统计

| 指标 | 数量 |
|------|------|
| **总功能** | 27 个新功能 |
| **总文件** | 34 个新文件 |
| **总代码** | ~240KB |
| **API 接口** | 100+ 个 |
| **数据模型** | 20+ 个 |
| **Git 提交** | 6 次 |

---

## 🔒 安全说明

1. **生产环境** 修改 `JWT_SECRET`
2. **启用 HTTPS**
3. **配置 CORS** 限制来源
4. **输入验证** 防止注入攻击
5. **定期备份** 数据库
6. **密码加密** 使用 bcryptjs
7. **请求限流** 防止暴力攻击

---

## 🚀 部署

### 后端部署

**方案 A：Heroku**
```bash
heroku create lobster-circle-api
heroku addons:create mongolab:sandbox
git push heroku main
```

**方案 B：阿里云/腾讯云 ECS**
- 购买服务器
- 安装 Node.js + MongoDB
- 使用 PM2 管理进程

**方案 C：Docker**
```bash
docker-compose up -d
```

### 前端部署

**打包 APK:**
```bash
cd apps/lobster-circle
npx eas build -p android
```

**打包 IPA（需要 Mac + 苹果开发者账号）:**
```bash
npx eas build -p ios
```

---

## 📝 开发说明

### 添加新功能

1. 在 `backend/models/` 创建数据模型
2. 在 `backend/routes/` 创建 API 路由
3. 在 `api.js` 添加前端 API 方法
4. 在对应页面使用

### 调试

**后端:**
```bash
npm run dev  # 自动重启
```

**前端:**
```bash
npm start    # Expo 开发服务器
```

---

## 📚 文档

- [完整功能文档](docs/DOCUMENTATION.md)
- [版本更新日志](docs/RELEASE_NOTES_v3.3.0.md)
- [测试指南](docs/TEST_GUIDE.md)
- [企业功能](docs/ENTERPRISE_FEATURES.md)
- [功能开关](docs/FUNCTION_SWITCHES.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- **GitHub**: https://github.com/Byaigo/lobster-circle
- **Issues**: https://github.com/Byaigo/lobster-circle/issues

---

## 🦞 关于

**版本**: 3.7.0  
**开发时间**: 2026-03-11 ~ 2026-03-14  
**开发者**: Byaigo  
**愿景**: 让社交更有趣！

---

**祝你使用愉快！** 🎉
