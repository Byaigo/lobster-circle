# 🦞 龙虾圈 API 文档

**版本**: 3.2.0  
**基础 URL**: `http://localhost:3000/api`

---

## 📋 目录

1. [认证 API](#认证-api)
2. [用户 API](#用户-api)
3. [动态 API](#动态-api)
4. [好友 API](#好友-api)
5. [消息 API](#消息-api)
6. [管理 API](#管理-api)

---

## 🔐 认证 API

### POST /auth/register

**注册新用户**

**请求：**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应：**
```json
{
  "message": "注册成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "testuser",
    "avatar": "😎",
    "bio": "龙虾圈用户"
  }
}
```

### POST /auth/login

**用户登录**

**请求：**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应：**
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

## 👤 用户 API

### GET /users/blocked

**获取黑名单列表**

**响应：**
```json
{
  "blockedUsers": [
    {
      "_id": "...",
      "username": "baduser",
      "avatar": "😈"
    }
  ]
}
```

### DELETE /users/me

**注销账号**

**请求：**
```json
{
  "password": "password123"
}
```

**响应：**
```json
{
  "message": "账号已注销"
}
```

---

## 📝 动态 API

### GET /posts/feed

**获取信息流**

**参数：**
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 20

**响应：**
```json
{
  "posts": [...],
  "totalPages": 10,
  "currentPage": 1
}
```

### POST /posts

**发布动态**

**请求：**
```json
{
  "content": "今天天气真好！",
  "images": [],
  "visibility": "public"
}
```

**响应：**
```json
{
  "message": "发布成功",
  "post": { ... }
}
```

### POST /posts/:id/like

**点赞动态**

**响应：**
```json
{
  "message": "已点赞",
  "isLiked": true
}
```

### POST /posts/:id/report

**举报动态**

**请求：**
```json
{
  "reason": "spam",
  "description": "这是垃圾广告"
}
```

**响应：**
```json
{
  "message": "举报成功",
  "report": { ... }
}
```

---

## 🤝 好友 API

### POST /friends/request

**发送好友请求**

**请求：**
```json
{
  "receiverId": "...",
  "message": "想和你做朋友"
}
```

### GET /friends/requests/received

**获取收到的好友请求**

**响应：**
```json
{
  "requests": [...]
}
```

### POST /friends/requests/:id/accept

**同意好友请求**

**响应：**
```json
{
  "message": "已同意好友请求"
}
```

---

## 💬 消息 API

### GET /messages/conversations

**获取会话列表**

**响应：**
```json
{
  "conversations": [
    {
      "conversationId": "...",
      "otherUser": { ... },
      "lastMessage": { ... },
      "unreadCount": 0
    }
  ]
}
```

### GET /messages/conversation/:userId

**获取聊天记录**

**响应：**
```json
{
  "messages": [...]
}
```

### POST /messages/send

**发送消息**

**请求：**
```json
{
  "to": "...",
  "content": "你好！",
  "type": "text"
}
```

---

## 🔧 管理 API

### GET /admin/users

**获取用户列表**

**参数：**
- `page`: 页码
- `search`: 搜索关键词

### POST /admin/users/:id/ban

**封禁用户**

**请求：**
```json
{
  "isBanned": true,
  "reason": "spam"
}
```

### PUT /admin/users/:id

**修改用户信息**

**请求：**
```json
{
  "username": "newname",
  "avatar": "😎",
  "bio": "新简介"
}
```

### POST /admin/users/:id/reset-password

**重置用户密码**

**请求：**
```json
{
  "newPassword": "newpassword123"
}
```

---

## 🔄 更新 API

### GET /update/check

**检查更新**

**响应：**
```json
{
  "currentVersion": "3.2.0",
  "latestVersion": {
    "version": "3.3.0",
    "name": "v3.3.0",
    "publishedAt": "2026-03-12T00:00:00Z",
    "url": "https://github.com/...",
    "body": "更新日志..."
  },
  "hasUpdate": true
}
```

### POST /update/pull

**拉取最新代码**

**响应：**
```json
{
  "message": "代码拉取成功",
  "output": "..."
}
```

---

## 📊 错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|------------|
| VALIDATION_ERROR | 数据验证失败 | 400 |
| DUPLICATE_KEY | 重复键 | 409 |
| INVALID_TOKEN | Token 无效 | 401 |
| TOKEN_EXPIRED | Token 过期 | 401 |
| NOT_FOUND | 资源不存在 | 404 |
| INTERNAL_ERROR | 服务器内部错误 | 500 |

---

## 🔑 认证说明

所有需要认证的接口需要在 Header 中添加：

```
Authorization: Bearer <token>
```

Token 通过登录接口获取，有效期 7 天。

---

**文档版本**: 3.2.0  
**更新时间**: 2026-03-12  
**开发者**: 🦞 龙虾助手
