# 🦞 龙虾圈 Lobster Circle - 完整功能文档

> 一个功能完整的社交 App - React Native + Node.js + MongoDB

**版本**: v3.7.0  
**更新日期**: 2026-03-14  
**代码量**: ~230KB (33 个新文件)  
**GitHub**: https://github.com/Byaigo/lobster-circle

---

## 📋 目录

1. [功能总览](#功能总览)
2. [社交核心功能](#社交核心功能)
3. [内容互动功能](#内容互动功能)
4. [个性化功能](#个性化功能)
5. [娱乐运营功能](#娱乐运营功能)
6. [工具安全功能](#工具安全功能)
7. [API 接口文档](#api 接口文档)
8. [技术架构](#技术架构)
9. [部署指南](#部署指南)

---

## 功能总览

### 📊 五批功能完成情况

| 批次 | 功能模块 | 新增功能 | 文件数 | 代码量 | 状态 |
|------|----------|----------|--------|--------|------|
| 第一批 | 社交增强 | 附近的人/群组系统/访客记录 | 10 | ~61KB | ✅ |
| 第二批 | 内容增强 | 投票系统/草稿箱 | 7 | ~45KB | ✅ |
| 第三批 | 个性化 | 主题皮肤/头像框/封面图 | 6 | ~42KB | ✅ |
| 第四批 | 互动娱乐 | 等级系统/成就徽章/幸运抽奖 | 5 | ~41KB | ✅ |
| 第五批 | 工具安全 | 隐私设置/免打扰/数据导出 | 5 | ~41KB | ✅ |

### 🎯 功能清单（27 个新功能）

#### 社交核心 (6 个)
- ✅ **附近的人** - 基于地理位置发现附近用户
- ✅ **群组系统** - 创建/加入群组，群聊功能
- ✅ **访客记录** - 查看谁访问了你的主页
- ✅ **好友系统** - 添加/管理好友
- ✅ **私信聊天** - 实时一对一聊天
- ✅ **动态发布** - 发布文字/图片/视频动态

#### 内容互动 (6 个)
- ✅ **投票系统** - 创建投票，多选/单选/匿名
- ✅ **草稿箱** - 自动保存未发布内容
- ✅ **点赞评论** - 完整互动系统
- ✅ **图片上传** - 七牛云 CDN 集成
- ✅ **话题标签** - #话题# 系统
- ✅ **搜索功能** - 用户/动态/话题搜索

#### 个性化 (6 个)
- ✅ **主题皮肤** - 多套配色方案（浅色/深色/VIP）
- ✅ **头像框** - 成就装饰系统
- ✅ **封面图** - 个人主页背景定制
- ✅ **等级系统** - 100 级经验值体系
- ✅ **成就徽章** - 任务成就系统
- ✅ **个人主页** - 完整资料展示

#### 娱乐运营 (5 个)
- ✅ **幸运抽奖** - 积分抽奖活动
- ✅ **签到系统** - 连续签到奖励
- ✅ **积分商城** - 积分兑换商品
- ✅ **通知中心** - 统一管理通知
- ✅ **反馈系统** - 用户反馈收集

#### 工具安全 (4 个)
- ✅ **隐私设置** - 精细化权限控制
- ✅ **消息免打扰** - 分时段/分用户静音
- ✅ **数据导出** - 导出个人全部数据
- ✅ **黑名单管理** - 屏蔽骚扰用户

---

## 社交核心功能

### 1. 附近的人 📍

**功能描述**: 基于地理位置发现附近的用户

**核心特性**:
- 按距离排序显示附近用户
- 可调节搜索范围（1-100km）
- 显示用户距离、在线状态、基本信息
- 统计附近用户数量和在线人数
- 自动更新用户位置
- 访客记录自动追踪

**API 接口**:
```
GET  /api/nearby/users          - 获取附近用户列表
POST /api/nearby/update-location - 更新用户位置
GET  /api/nearby/stats           - 获取附近统计
```

**数据模型**: `User.location` (GeoJSON Point)

---

### 2. 群组系统 👥

**功能描述**: 完整的群组社交功能

**核心特性**:
- 创建群组（公开/审核/私密）
- 加入/退出群组
- 群组设置（最大人数、发言权限等）
- 群主/管理员权限管理
- 群成员等级和积分系统
- 群公告功能
- 群聊消息（文本/图片/语音/视频）
- 消息已读状态
- 表情回应
- 探索公开群组

**API 接口**:
```
GET    /api/groups              - 我的群组列表
GET    /api/groups/explore      - 探索群组
GET    /api/groups/:id          - 群组详情
POST   /api/groups              - 创建群组
POST   /api/groups/:id/join     - 加入群组
POST   /api/groups/:id/leave    - 退出群组
GET    /api/groups/:id/messages - 获取群消息
POST   /api/groups/:id/messages - 发送群消息
PUT    /api/groups/:id          - 更新群组
DELETE /api/groups/:id          - 解散群组
```

**数据模型**: `Group`, `GroupMessage`

---

### 3. 访客记录 👀

**功能描述**: 查看谁访问了你的主页

**核心特性**:
- 记录访客访问行为
- 区分访问类型（主页/动态/相册）
- 匿名访问模式
- 未读访客标记
- 访客统计（今日/本周/总计）
- 一键标记已读
- 访问时长记录
- 同一天去重记录

**API 接口**:
```
GET  /api/visitors             - 访客列表
GET  /api/visitors/unread-count - 未读数量
POST /api/visitors/mark-read   - 标记已读
GET  /api/visitors/visited     - 我访问过的人
POST /api/visitors/record      - 记录访问
GET  /api/visitors/stats       - 访客统计
```

**数据模型**: `VisitRecord`

---

## 内容互动功能

### 1. 投票系统 📊

**功能描述**: 创建和参与投票

**核心特性**:
- 创建投票（支持 2-10 个选项）
- 单选/多选模式
- 匿名投票
- 允许/禁止修改选择
- 实时统计结果（百分比）
- 投票过期时间设置
- 创建者可关闭投票

**API 接口**:
```
GET  /api/polls/:id           - 获取投票详情
POST /api/polls               - 创建投票
POST /api/polls/:id/vote      - 投票
GET  /api/polls/user/:userId  - 用户的投票
PUT  /api/polls/:id           - 更新投票
DELETE /api/polls/:id         - 删除投票
POST /api/polls/:id/close     - 关闭投票
```

**数据模型**: `Poll`

---

### 2. 草稿箱 📝

**功能描述**: 自动保存未发布内容

**核心特性**:
- 自动保存未发布内容
- 支持文字/图片/视频/投票
- 定时发布草稿
- 一键发布草稿
- 草稿列表管理
- 7 天自动清理

**API 接口**:
```
GET  /api/drafts              - 获取草稿列表
GET  /api/drafts/:id          - 获取草稿详情
POST /api/drafts              - 创建/更新草稿
DELETE /api/drafts/:id        - 删除草稿
POST /api/drafts/:id/publish  - 发布草稿
GET  /api/drafts/scheduled/pending - 待定时发布
```

**数据模型**: `Draft`

---

## 个性化功能

### 1. 主题皮肤 🎨

**功能描述**: 多套配色方案

**核心特性**:
- 多套配色方案（浅色/深色/VIP）
- 自定义主色调/背景色/文字颜色
- 一键切换主题
- 主题预览功能

**API 接口**:
```
GET /api/customize/themes       - 获取所有主题
GET /api/customize/themes/:key  - 获取主题详情
POST /api/customize/themes/apply - 应用主题
```

**数据模型**: `Theme`

---

### 2. 头像框系统 🖼️

**功能描述**: 成就装饰系统

**核心特性**:
- 多种稀有度（普通/稀有/史诗/传说）
- 获取方式多样（成就/活动/VIP/等级）
- 限时/永久头像框
- 一键装备/卸下

**API 接口**:
```
GET  /api/customize/frames      - 获取所有头像框
GET  /api/customize/frames/mine - 获取我的头像框
POST /api/customize/frames/:id/equip - 装备头像框
POST /api/customize/frames/:id/unlock - 解锁头像框
```

**数据模型**: `AvatarFrame`, `UserFrame`

---

### 3. 等级系统 📈

**功能描述**: 经验值/等级体系

**核心特性**:
- 100 级等级体系
- 经验值获取（每日上限 1000）
- 等级头衔（11 个头衔）
- 等级排行榜
- 升级历史记录

**等级头衔**:
| 等级 | 头衔 |
|------|------|
| 1 | 新手龙虾 |
| 10 | 活跃龙虾 |
| 20 | 人气龙虾 |
| 30 | 明星龙虾 |
| 40 | 网红龙虾 |
| 50 | 龙虾达人 |
| 60 | 龙虾专家 |
| 70 | 龙虾大师 |
| 80 | 龙虾传奇 |
| 90 | 龙虾之神 |
| 100 | 龙虾至尊 |

**API 接口**:
```
GET /api/level/leaderboard - 等级排行榜
GET /api/level/me          - 我的等级信息
```

**数据模型**: `UserLevel`

---

## 娱乐运营功能

### 1. 幸运抽奖 🎰

**功能描述**: 积分抽奖活动

**核心特性**:
- 3 种活动类型（每日/活动/永久）
- 自定义奖池配置
- 权重概率系统
- 每日免费次数
- 积分抽奖
- 奖品自动发放
- 抽奖历史记录

**API 接口**:
```
GET  /api/lottery              - 获取抽奖活动
GET  /api/lottery/:id          - 获取活动详情
POST /api/lottery/:id/draw     - 抽奖
GET  /api/lottery/records      - 我的抽奖记录
```

**数据模型**: `Lottery`, `LotteryRecord`

---

## 工具安全功能

### 1. 隐私设置 🔒

**功能描述**: 精细化权限控制

**核心特性**:
- 可见性控制（动态/相册/在线状态/访客）
- 互动权限（评论/@/消息/好友请求）
- 发现设置（附近的人/推荐/搜索）
- 通知开关
- 黑名单/白名单管理

**API 接口**:
```
GET  /api/tools/privacy              - 获取隐私设置
PUT  /api/tools/privacy              - 更新隐私设置
GET  /api/tools/privacy/blacklist    - 获取黑名单
POST /api/tools/privacy/blacklist/:userId - 加入黑名单
DELETE /api/tools/privacy/blacklist/:userId - 移除黑名单
```

**数据模型**: `PrivacySettings`

---

### 2. 消息免打扰 🔕

**功能描述**: 分时段/分用户静音

**核心特性**:
- 全局免打扰模式
- 定时免打扰（时间段/星期）
- 用户级别免打扰
- 群组免打扰
- 关键词过滤
- 推送设置

**API 接口**:
```
GET  /api/tools/dnd              - 获取免打扰设置
PUT  /api/tools/dnd              - 更新免打扰设置
POST /api/tools/dnd/user/:userId - 设置用户免打扰
DELETE /api/tools/dnd/user/:userId - 移除用户免打扰
```

**数据模型**: `DndSettings`

---

### 3. 数据导出 📦

**功能描述**: 导出个人全部数据

**核心特性**:
- 导出个人全部数据
- 支持 JSON/HTML/ZIP 格式
- 异步导出处理
- 进度追踪
- 7 天有效期
- 下载计数

**API 接口**:
```
GET  /api/tools/data-export           - 获取导出记录
POST /api/tools/data-export           - 创建导出请求
GET  /api/tools/data-export/:id/download - 下载导出文件
DELETE /api/tools/data-export/:id     - 删除导出记录
```

**数据模型**: `DataExport`

---

## API 接口文档

### 完整路由表

| 模块 | 基础路径 | 文件 |
|------|----------|------|
| 认证 | `/api/auth` | routes/auth.js |
| 用户 | `/api/users` | routes/users.js |
| 动态 | `/api/posts` | routes/posts.js |
| 评论 | `/api/comments` | routes/comments.js |
| 点赞 | `/api/likes` | routes/likes.js |
| 好友 | `/api/friends` | routes/friends.js |
| 聊天 | `/api/chat` | routes/chat.js |
| 通知 | `/api/notifications` | routes/notifications.js |
| 上传 | `/api/upload` | routes/upload.js |
| 搜索 | `/api/search` | routes/search.js |
| 签到 | `/api/checkin` | routes/checkin.js |
| 商城 | `/api/mall` | routes/mall.js |
| 反馈 | `/api/feedback` | routes/feedback.js |
| 管理 | `/api/admin` | routes/admin.js |
| 附近 | `/api/nearby` | routes/nearby.js |
| 群组 | `/api/groups` | routes/groups.js |
| 访客 | `/api/visitors` | routes/visitors.js |
| 投票 | `/api/polls` | routes/polls.js |
| 草稿 | `/api/drafts` | routes/drafts.js |
| 个性化 | `/api/customize` | routes/customize.js |
| 娱乐 | `/api/entertainment` | routes/entertainment.js |
| 工具 | `/api/tools` | routes/tools.js |

---

## 技术架构

### 前端技术栈
- **框架**: React Native
- **导航**: React Navigation (Stack + Bottom Tab)
- **状态管理**: React Context + Hooks
- **HTTP 客户端**: Axios
- **实时通信**: Socket.io Client
- **图片选择**: expo-image-picker
- **图标**: react-native-vector-icons

### 后端技术栈
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **实时通信**: Socket.io
- **认证**: JWT (jsonwebtoken)
- **安全**: Helmet, CORS, express-rate-limit
- **压缩**: compression
- **文件上传**: 七牛云 CDN

### 数据模型
```
User (用户)
├── UserLevel (等级)
├── PrivacySettings (隐私)
├── DndSettings (免打扰)
└── UserFrame (头像框)

Post (动态)
├── Comment (评论)
├── Like (点赞)
└── Poll (投票)

Group (群组)
└── GroupMessage (群消息)

Draft (草稿)
VisitRecord (访客)
DataExport (数据导出)
```

---

## 部署指南

### 环境要求
- Node.js >= 16.x
- MongoDB >= 4.0
- npm >= 8.x

### 后端部署

```bash
cd apps/lobster-circle/backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 配置 MongoDB URI 等

# 启动服务器
npm start

# 或生产环境
NODE_ENV=production npm start
```

### 前端部署

```bash
cd apps/lobster-circle

# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

### 环境变量

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/lobster-circle

# 服务器
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# JWT
JWT_SECRET=your-secret-key

# 七牛云
QINIU_ACCESS_KEY=xxx
QINIU_SECRET_KEY=xxx
QINIU_BUCKET=xxx
```

---

## 📊 项目统计

- **总文件数**: 85+ 文件
- **总代码量**: ~500KB
- **新增功能**: 27 个
- **API 接口**: 100+ 个
- **数据模型**: 20+ 个

---

## 🦞 关于龙虾圈

龙虾圈是一个功能完整的社交 App，提供动态发布、好友聊天、群组互动、附近的人等核心社交功能，同时包含等级系统、成就徽章、幸运抽奖等娱乐功能，以及隐私设置、数据导出等工具功能。

**愿景**: 让社交更有趣！

**License**: MIT

---

*最后更新：2026-03-14*
