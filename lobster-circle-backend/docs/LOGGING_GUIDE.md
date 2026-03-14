# 🦞 日志系统使用指南

## 概述

龙虾圈后端使用结构化日志系统，支持：
- ✅ 日志分级（ERROR/WARN/INFO/DEBUG）
- ✅ 请求追踪（Request ID）
- ✅ 自动文件轮转（按日期）
- ✅ 性能追踪（响应时间）
- ✅ 安全审计（敏感操作记录）

---

## 日志级别

| 级别 | 说明 | 使用场景 |
|------|------|---------|
| **ERROR** | 错误 | 系统错误、异常、失败的操作 |
| **WARN** | 警告 | 可恢复的错误、异常情况、4xx 响应 |
| **INFO** | 信息 | 正常操作、重要业务事件 |
| **DEBUG** | 调试 | 详细请求信息、开发调试 |

---

## 日志文件位置

```
lobster-circle-backend/
└── logs/
    ├── app-2026-03-13.log      # 所有日志
    ├── error-2026-03-13.log    # 仅错误日志
    ├── app-2026-03-14.log
    └── error-2026-03-14.log
```

**日志文件按日期自动分割，便于管理和归档。**

---

## 日志格式

所有日志都是 JSON 格式，方便机器解析：

```json
{
  "timestamp": "2026-03-13T15:30:00.000Z",
  "level": "INFO",
  "message": "Request completed",
  "requestId": "k3x9z2a1b-abc123def",
  "method": "POST",
  "path": "/api/posts",
  "status": 201,
  "duration": "45ms",
  "userId": "507f1f77bcf86cd799439011"
}
```

---

## 使用方式

### 1. 在路由中使用

```javascript
const log = require('./middleware/logger');

router.get('/users', async (req, res) => {
  log.info('Fetching users', {
    userId: req.user.id,
    query: req.query,
  });
  
  const users = await User.find();
  
  log.debug('Users fetched', {
    count: users.length,
  });
  
  res.json({ success: true, data: users });
});
```

### 2. 记录错误

```javascript
try {
  await someOperation();
} catch (error) {
  log.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    userId: req.user.id,
  });
  throw error;
}
```

### 3. 记录业务事件

```javascript
// 用户登录
log.info('User logged in', {
  userId: user.id,
  ip: req.ip,
  userAgent: req.get('user-agent'),
});

// 文件上传
log.info('File uploaded', {
  userId: req.user.id,
  fileId: file.id,
  size: file.size,
  type: file.mimetype,
});

// 敏感操作（删除、封禁等）
log.warn('User banned', {
  userId: req.user.id,
  targetUserId: targetUser.id,
  reason: banReason,
  adminId: req.admin?.id,
});
```

---

## 日志配置

### 环境变量

在 `.env` 文件中配置：

```bash
# 日志级别（ERROR/WARN/INFO/DEBUG）
LOG_LEVEL=INFO

# 运行环境（production/development）
NODE_ENV=production
```

### 日志级别说明

| LOG_LEVEL | 记录的日志 |
|-----------|-----------|
| `ERROR` | 仅错误 |
| `WARN` | 错误 + 警告 |
| `INFO` | 错误 + 警告 + 信息（生产环境推荐） |
| `DEBUG` | 所有日志（开发环境推荐） |

---

## 日志分析

### 使用 grep 快速查找

```bash
# 查找所有错误
grep '"level":"ERROR"' logs/app-2026-03-13.log

# 查找特定用户的日志
grep '"userId":"507f...9011"' logs/app-2026-03-13.log

# 查找慢请求（duration > 1000ms）
grep '"duration":"[1-9][0-9][0-9][0-9]ms"' logs/app-2026-03-13.log

# 查找特定 API 的日志
grep '"path":"/api/posts"' logs/app-2026-03-13.log
```

### 使用 jq 解析 JSON 日志

```bash
# 安装 jq
# Windows: choco install jq
# macOS: brew install jq

# 格式化输出
cat logs/app-2026-03-13.log | jq .

# 筛选错误日志
cat logs/app-2026-03-13.log | jq 'select(.level == "ERROR")'

# 统计各级别日志数量
cat logs/app-2026-03-13.log | jq -r '.level' | sort | uniq -c

# 找出最慢的 10 个请求
cat logs/app-2026-03-13.log | jq -r 'select(.duration) | "\(.duration) \(.path)"' | sort -rn | head -10
```

### 使用 Node.js 脚本分析

创建 `scripts/analyze-logs.js`：

```javascript
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', 'logs', 'app-2026-03-13.log');
const logs = fs.readFileSync(logFile, 'utf-8')
  .split('\n')
  .filter(line => line.trim())
  .map(line => JSON.parse(line));

// 统计
const stats = {
  total: logs.length,
  errors: logs.filter(l => l.level === 'ERROR').length,
  warnings: logs.filter(l => l.level === 'WARN').length,
  avgDuration: logs
    .filter(l => l.duration)
    .reduce((sum, l) => sum + parseInt(l.duration), 0) / logs.length,
};

console.log('日志统计:', stats);
```

---

## 错误追踪

### 错误 ID 追踪

每个错误都有唯一的 `errorId`，可以通过它在日志中追踪完整链路：

```bash
# 查找特定错误的所有日志
grep "k3x9z2a1b-abc123def" logs/app-2026-03-13.log
```

### 请求 ID 追踪

每个请求都有唯一的 `requestId`，记录在响应头 `X-Request-ID` 中：

```javascript
// 客户端可以在请求失败时提供 requestId
const requestId = response.headers['x-request-id'];
console.log('Request ID for support:', requestId);
```

---

## 日志轮转

### 自动轮转

日志按日期自动分割，不需要额外配置。

### 手动清理旧日志

```bash
# 删除 30 天前的日志
find logs/ -name "*.log" -mtime +30 -delete

# Windows PowerShell
Get-ChildItem logs\*.log | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

### 日志归档

```bash
# 压缩旧日志
tar -czf logs-2026-03.tar.gz logs/app-2026-03-*.log
```

---

## 最佳实践

### ✅ 推荐

- 生产环境使用 `LOG_LEVEL=INFO`
- 记录所有敏感操作（删除、封禁、权限变更）
- 记录外部 API 调用的响应时间
- 使用 `asyncHandler` 包装异步路由
- 在错误日志中包含足够的上下文信息

### ❌ 避免

- 不要记录敏感信息（密码、token、完整信用卡号）
- 不要在日志中记录大对象（如文件内容）
- 不要在生产环境使用 `LOG_LEVEL=DEBUG`（日志量太大）
- 不要忽略异步错误（始终用 try-catch 或 asyncHandler）

---

## 与 Sentry 集成

日志系统已经为 Sentry 集成做好准备。在 `errorHandler.js` 中添加：

```javascript
const Sentry = require('@sentry/node');

const errorHandler = (err, req, res, next) => {
  // 记录到 Sentry
  Sentry.captureException(err, {
    extra: {
      requestId: req.requestId,
      userId: req.user?.id,
      path: req.path,
    },
  });
  
  // ... 原有逻辑
};
```

---

## 故障排查

### 问题：日志没有写入文件

1. 检查 `logs/` 目录是否存在
2. 检查文件权限
3. 检查磁盘空间

### 问题：日志量太大

1. 调高 `LOG_LEVEL`（如从 DEBUG 改为 INFO）
2. 减少不必要的 `log.debug()` 调用
3. 设置日志轮转策略

### 问题：找不到特定日志

1. 确认日期是否正确（日志按日期分割）
2. 使用 `grep` 搜索所有日志文件
3. 检查 `requestId` 或 `errorId` 是否正确

---

**有了完善的日志系统，任何问题都能快速定位！** 🦞📝
