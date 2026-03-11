# 🦞 龙虾圈 - 功能开关系统说明

## ✨ 功能开关系统（v3.1）

管理员可以通过 API 动态控制各项功能的启用/禁用状态，无需重启服务器。

---

## 📡 API 使用指南

### 1. 初始化默认配置

首次使用需要初始化默认配置：

```bash
POST /api/config/init
Authorization: Bearer <admin_token>
```

**响应：**
```json
{
  "message": "初始化完成，新增 14 个配置"
}
```

### 2. 获取所有配置（管理员）

```bash
GET /api/config?category=content
Authorization: Bearer <admin_token>
```

**响应：**
```json
{
  "configs": [
    {
      "_id": "...",
      "key": "allow_post",
      "value": true,
      "description": "允许用户发帖",
      "category": "content",
      "isPublic": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### 3. 获取公开配置（客户端）

客户端可以获取公开的配置：

```bash
GET /api/config/public
```

**响应：**
```json
{
  "configs": {
    "allow_register": true,
    "allow_post": true,
    "allow_comment": true,
    "maintenance_mode": false,
    "max_images_per_post": 9,
    "max_post_length": 1000,
    "app_version": "1.0.0",
    "announcement": ""
  }
}
```

### 4. 更新配置

```bash
PUT /api/config/allow_post
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "value": false
}
```

**响应：**
```json
{
  "message": "配置已更新",
  "config": {
    "key": "allow_post",
    "value": false,
    "description": "允许用户发帖",
    "category": "content"
  }
}
```

---

## 🔧 可用配置项

### 用户相关

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `allow_register` | Boolean | true | 允许新用户注册 |
| `allow_friend_request` | Boolean | true | 允许发送好友请求 |
| `allow_private_message` | Boolean | true | 允许私信 |

### 内容相关

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `allow_post` | Boolean | true | 允许用户发帖 |
| `allow_comment` | Boolean | true | 允许用户评论 |
| `post_review_required` | Boolean | false | 发帖需要审核 |
| `max_images_per_post` | Number | 9 | 每帖最大图片数 |
| `max_post_length` | Number | 1000 | 帖子最大长度 |

### 安全相关

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enable_sensitive_word_filter` | Boolean | true | 启用敏感词过滤 |
| `enable_report_system` | Boolean | true | 启用举报系统 |

### 系统相关

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `maintenance_mode` | Boolean | false | 维护模式 |
| `app_version` | String | "1.0.0" | 当前应用版本 |
| `min_app_version` | String | "1.0.0" | 最低应用版本 |
| `announcement` | String | "" | 系统公告 |

---

## 🚨 错误处理

### 功能被禁用

```json
{
  "error": "当前禁止发帖，请稍后再试",
  "code": "POST_DISABLED"
}
```

### 维护模式

```json
{
  "error": "系统维护中，请稍后再试",
  "code": "MAINTENANCE_MODE"
}
```

### 敏感词检测

```json
{
  "error": "内容包含敏感词，请修改后重新提交",
  "code": "SENSITIVE_WORD_DETECTED",
  "details": [
    { "word": "xxx", "category": "spam", "level": "medium" }
  ]
}
```

---

## 📱 前端集成

### 检查功能状态

```javascript
// 获取公开配置
const response = await fetch(`${API_BASE_URL}/config/public`);
const { configs } = await response.json();

// 检查是否允许发帖
if (!configs.allow_post) {
  Alert.alert('提示', '当前禁止发帖，请稍后再试');
  return;
}

// 检查维护模式
if (configs.maintenance_mode) {
  Alert.alert('系统维护', '系统维护中，请稍后再试');
  return;
}
```

### 发帖时

```javascript
const createPost = async (content, images) => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, images })
    });

    const data = await response.json();

    if (data.code === 'POST_DISABLED') {
      Alert.alert('提示', '当前禁止发帖');
      return;
    }

    if (data.code === 'SENSITIVE_WORD_DETECTED') {
      Alert.alert('提示', '内容包含敏感词，请修改后重新提交');
      return;
    }

    if (data.post.needsReview) {
      Alert.alert('发布成功', '内容已提交，等待审核');
      return;
    }

    Alert.alert('发布成功', '动态已发布');
  } catch (error) {
    console.error('发帖失败:', error);
  }
};
```

---

## 🔒 敏感词过滤

### 添加敏感词

```bash
POST /api/sensitive-words
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "word": "敏感词",
  "category": "spam",
  "level": "medium",
  "action": "block"
}
```

### 批量添加

```bash
POST /api/sensitive-words/batch
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "words": [
    { "word": "广告词 1", "category": "ad", "action": "block" },
    { "word": "广告词 2", "category": "ad", "action": "replace" }
  ]
}
```

### 敏感词操作类型

| action | 说明 |
|--------|------|
| `block` | 直接阻止发布 |
| `replace` | 自动替换为 `***` |
| `review` | 标记为需要审核 |

### 敏感词分类

| category | 说明 |
|----------|------|
| `politics` | 政治敏感 |
| `porn` | 色情内容 |
| `violence` | 暴力内容 |
| `spam` | 垃圾广告 |
| `ad` | 广告推广 |
| `other` | 其他 |

---

## 📊 操作日志

所有管理员操作都会被记录：

```bash
GET /api/admin/logs?module=config
Authorization: Bearer <admin_token>
```

**日志内容：**
- 管理员 ID
- 操作类型
- 操作模块
- 目标 ID
- 操作详情
- IP 地址
- User-Agent
- 操作时间

---

## 🎯 使用场景

### 场景 1：临时禁止发帖

```bash
# 禁止发帖
curl -X PUT http://localhost:3000/api/config/allow_post \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value": false}'

# 恢复发帖
curl -X PUT http://localhost:3000/api/config/allow_post \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value": true}'
```

### 场景 2：开启维护模式

```bash
curl -X PUT http://localhost:3000/api/config/maintenance_mode \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value": true}'
```

### 场景 3：添加敏感词

```bash
curl -X POST http://localhost:3000/api/sensitive-words \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"word":"广告词","category":"ad","action":"block"}'
```

---

## 🦞 关于

**版本**: 3.1.0  
**更新时间**: 2026-03-11  
**开发者**: 🦞 龙虾助手

---

**祝你使用愉快！** 🎉
