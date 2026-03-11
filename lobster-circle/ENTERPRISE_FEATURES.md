# 🦞 龙虾圈 - 企业级功能说明

## ✨ 新增功能（v3.0）

### 1. 后台管理系统 👨‍💼

**管理员登录**
- 独立的管理员账号系统
- 权限分级（admin / super_admin）
- JWT 认证

**用户管理**
- 查看所有用户列表
- 搜索用户
- 封禁/解封用户
- 查看封禁原因

**内容审核**
- 查看所有动态
- 删除违规动态
- 查看被举报的内容

**举报管理**
- 查看用户举报
- 处理举报（通过/拒绝）
- 添加处理备注
- 自动删除违规内容

**数据统计**
- 用户总数
- 动态总数
- 待处理举报数
- 在线用户数
- 本周新增用户

### 2. 图片上传功能 📷

**本地上传**
- 单图上传（最大 10MB）
- 多图上传（最多 9 张）
- 支持格式：jpeg, jpg, png, gif, webp
- 自动生成唯一文件名

**云存储集成（可选）**
- 七牛云
- 阿里云 OSS
- AWS S3

### 3. 个人主页 👤

**功能**
- 查看自己/他人的动态
- 显示粉丝/关注/动态数
- 关注/取消关注
- 发送好友请求
- 收藏展示（自己的页面）

### 4. 推送通知 🔔

**通知类型**
- 点赞通知
- 评论通知
- 关注通知
- 好友请求
- 新消息
- 系统通知（封禁等）
- 举报处理通知

**推送方式**
- 应用内通知（已实现）
- 离线推送（需集成极光/个推）

### 5. 隐私设置 🔒

**可见性控制**
- 公开（所有人可见）
- 好友可见
- 私密（仅自己可见）

**黑名单**
- 拉黑用户
- 查看黑名单
- 取消拉黑

---

## 📡 新增 API

### 管理员 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/admin/login` | POST | 管理员登录 |
| `/api/admin/stats` | GET | 获取统计数据 |
| `/api/admin/users` | GET | 用户列表 |
| `/api/admin/users/:id/ban` | POST | 封禁/解封用户 |
| `/api/admin/posts` | GET | 动态列表 |
| `/api/admin/posts/:id` | DELETE | 删除动态 |
| `/api/admin/reports` | GET | 举报列表 |
| `/api/admin/reports/:id/handle` | POST | 处理举报 |

### 图片上传 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/upload/image` | POST | 单图上传 |
| `/api/upload/images` | POST | 多图上传（最多 9 张） |

### 举报 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/reports` | POST | 提交举报 |
| `/api/reports` | GET | 我的举报列表 |

---

## 🚀 使用指南

### 创建管理员账号

首次使用需要手动创建管理员：

```javascript
// 在 MongoDB 中直接插入
db.admins.insertOne({
  username: "admin",
  password: "$2a$10$...", // 使用 bcrypt 加密 "admin123"
  role: "super_admin",
  permissions: {
    banUser: true,
    deletePost: true,
    viewStats: true,
    manageAdmins: true
  },
  createdAt: new Date()
})
```

或使用注册脚本（开发中）

### 后台管理系统

**访问地址：** `http://localhost:3000/admin`（需开发 Web 界面）

**或使用 API：**

```bash
# 管理员登录
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取统计
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer <token>"

# 封禁用户
curl -X POST http://localhost:3000/api/admin/users/:id/ban \
  -H "Authorization: Bearer <token>" \
  -d '{"isBanned":true,"reason":"发布违规内容"}'
```

### 图片上传

```bash
# 单图上传
curl -X POST http://localhost:3000/api/upload/image \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/image.jpg"

# 多图上传
curl -X POST http://localhost:3000/api/upload/images \
  -H "Authorization: Bearer <token>" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

---

## 📱 前端集成

### 图片上传

```javascript
import * as ImagePicker from 'expo-image-picker';

const pickAndUpload = async () => {
  // 选择图片
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    // 上传
    const formData = new FormData();
    result.assets.forEach((asset, index) => {
      formData.append('images', {
        uri: asset.uri,
        name: asset.fileName,
        type: asset.mimeType,
      });
    });

    const response = await fetch(`${API_BASE_URL}/upload/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();
    // data.images 包含上传后的 URL
  }
};
```

### 个人主页

```javascript
// 导航到个人主页
navigation.navigate('ProfilePage', { userId: 'xxx' });

// 导航到自己的主页
navigation.navigate('ProfilePage');
```

---

## 🔒 安全说明

### 管理员权限

| 权限 | admin | super_admin |
|------|-------|-------------|
| 封禁用户 | ✅ | ✅ |
| 删除动态 | ✅ | ✅ |
| 查看统计 | ✅ | ✅ |
| 管理管理员 | ❌ | ✅ |

### 文件上传安全

- 文件类型限制（仅图片）
- 文件大小限制（10MB）
- 文件名随机化
- 防止路径遍历攻击

### 举报系统

- 防止重复举报（唯一索引）
- 举报处理记录
- 通知举报人处理结果

---

## 📊 数据统计

后台提供以下统计数据：

1. **用户统计**
   - 总用户数
   - 在线用户数
   - 本周新增用户

2. **内容统计**
   - 总动态数
   - 今日新增动态

3. **审核统计**
   - 待处理举报数
   - 已处理举报数
   - 封禁用户数

---

## 🎯 下一步扩展

### 已完成
- ✅ 后台管理系统
- ✅ 图片上传
- ✅ 个人主页
- ✅ 通知系统
- ✅ 举报系统

### 开发中
- ⏳ 后台管理 Web 界面
- ⏳ 云存储集成
- ⏳ 离线推送

### 计划中
- 📋 视频上传
- 📋 直播功能
- 📋 话题聚合页
- 📋 数据分析大屏

---

**版本**: 3.0.0 (企业版)  
**更新时间**: 2026-03-11  
**开发者**: 🦞 龙虾助手
