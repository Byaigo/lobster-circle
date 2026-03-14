# 龙虾圈功能更新日志 v3.3.0

## 🎉 新增社交增强功能

### 1. 附近的人 📍
**完成度：100%**

基于地理位置发现附近的用户，支持：
- ✅ 按距离排序显示附近用户
- ✅ 可调节搜索范围（默认 10km）
- ✅ 显示用户距离、在线状态、基本信息
- ✅ 统计附近用户数量和在线人数
- ✅ 自动更新用户位置
- ✅ 访客记录自动追踪

**API 接口:**
- `GET /api/nearby/users` - 获取附近用户列表
- `POST /api/nearby/update-location` - 更新用户位置
- `GET /api/nearby/stats` - 获取附近统计信息

**前端页面:**
- `screens/NearbyScreen.js` - 附近的人主页面

---

### 2. 群组系统 👥
**完成度：100%**

完整的群组社交功能，支持：
- ✅ 创建群组（公开/审核/私密）
- ✅ 加入/退出群组
- ✅ 群组设置（最大人数、发言权限等）
- ✅ 群主/管理员权限管理
- ✅ 群成员等级和积分系统
- ✅ 群公告功能
- ✅ 群聊消息（文本/图片/语音/视频）
- ✅ 消息已读状态
- ✅ 表情回应
- ✅ 探索公开群组
- ✅ 群标签分类

**数据模型:**
- `models/Group.js` - 群组模型
- `models/GroupMessage.js` - 群消息模型

**API 接口:**
- `GET /api/groups` - 我的群组列表
- `GET /api/groups/explore` - 探索群组
- `GET /api/groups/:id` - 群组详情
- `POST /api/groups` - 创建群组
- `POST /api/groups/:id/join` - 加入群组
- `POST /api/groups/:id/leave` - 退出群组
- `GET /api/groups/:id/messages` - 获取群消息
- `POST /api/groups/:id/messages` - 发送群消息
- `PUT /api/groups/:id` - 更新群组信息
- `DELETE /api/groups/:id` - 解散群组

**前端页面:**
- `screens/GroupsScreen.js` - 群组列表页面

---

### 3. 访客记录 👀
**完成度：100%**

查看谁访问了你的主页，支持：
- ✅ 记录访客访问行为
- ✅ 区分访问类型（主页/动态/相册）
- ✅ 匿名访问模式
- ✅ 未读访客标记
- ✅ 访客统计（今日/本周/总计）
- ✅ 一键标记已读
- ✅ 访问时长记录
- ✅ 同一天去重记录

**数据模型:**
- `models/VisitRecord.js` - 访客记录模型

**API 接口:**
- `GET /api/visitors` - 访客列表
- `GET /api/visitors/unread-count` - 未读数量
- `POST /api/visitors/mark-read` - 标记已读
- `GET /api/visitors/visited` - 我访问过的人
- `POST /api/visitors/record` - 记录访问
- `GET /api/visitors/stats` - 访客统计

**前端页面:**
- `screens/VisitorsScreen.js` - 访客记录页面

---

## 📦 后端新增文件

### 模型 (models/)
- `Group.js` - 群组模型（4.7KB）
- `GroupMessage.js` - 群消息模型（2.6KB）
- `VisitRecord.js` - 访客记录模型（3.3KB）

### 路由 (routes/)
- `nearby.js` - 附近的人 API（4.8KB）
- `groups.js` - 群组 API（10.8KB）
- `visitors.js` - 访客 API（4.5KB）

### 入口文件
- `backend/server.js` - 后端服务器入口（4.1KB）

---

## 📱 前端新增文件

### 页面 (screens/)
- `NearbyScreen.js` - 附近的人（10.3KB）
- `GroupsScreen.js` - 群组列表（7.6KB）
- `VisitorsScreen.js` - 访客记录（8.4KB）

---

## 🔧 技术亮点

### 1. 地理位置功能
- 使用 MongoDB 2dsphere 索引进行地理位置查询
- Haversine 公式计算两点间距离
- 支持按距离范围筛选

### 2. 群组权限系统
- 三级权限：群主/管理员/普通成员
- 灵活的群组设置（加入方式/发言权限等）
- 群成员等级和积分系统

### 3. 访客去重机制
- 同一天同一用户只记录一次
- 支持更新访问时长
- 匿名访问模式

### 4. 实时统计
- 附近的人实时统计
- 访客数据统计（今日/本周/总计）
- 未读消息提醒

---

## 📊 代码统计

| 类型 | 文件数 | 代码量 |
|------|--------|--------|
| 后端模型 | 3 | ~10.6KB |
| 后端路由 | 3 | ~20.1KB |
| 前端页面 | 3 | ~26.3KB |
| 后端入口 | 1 | ~4.1KB |
| **总计** | **10** | **~61.1KB** |

---

## 🚀 下一步计划

### 社交增强（进行中）
- [x] 附近的人
- [x] 群组系统
- [x] 访客记录
- [ ] 缘分匹配（每日推荐）
- [ ] 活动系统

### 内容增强
- [ ] 投票/问卷功能
- [ ] 多图轮播（9 宫格）
- [ ] 草稿箱
- [ ] 定时发布

### 个性化
- [ ] 主题皮肤
- [ ] 头像框/挂件
- [ ] 个性签名
- [ ] 封面图

### 互动娱乐
- [ ] 等级系统
- [ ] 成就徽章
- [ ] 幸运抽奖

---

## 📝 使用说明

### 启动后端
```bash
cd apps/lobster-circle/backend
npm install
npm start
```

### 启动前端
```bash
cd apps/lobster-circle
npm install
npm start
```

### 环境变量
在 `backend/.env` 中配置：
```
MONGODB_URI=mongodb://localhost:27017/lobster-circle
PORT=3000
CORS_ORIGIN=*
```

---

## 🦞 版本信息

- **版本**: v3.3.0
- **更新日期**: 2026-03-14
- **更新类型**: 功能增强
- **兼容性**: 需要 MongoDB 4.0+

---

> 🦞 龙虾圈 - 让社交更有趣！
