# 🦞 Sentry 错误追踪集成指南

## 概述

Sentry 是一个强大的错误追踪和性能监控平台，可以帮助我们：
- 实时捕获后端和前端错误
- 追踪性能问题（慢 API、慢查询）
- 监控用户影响范围
- 自动聚合相似错误

---

## 第一步：创建 Sentry 项目

### 1.1 注册/登录 Sentry

访问：https://sentry.io

推荐使用 GitHub 登录（方便团队协作）

### 1.2 创建项目

1. 点击 "Create Project"
2. 选择平台：
   - **后端：** Node.js
   - **前端：** React Native
3. 项目名称：
   - 后端：`lobster-circle-backend`
   - 前端：`lobster-circle-app`

### 1.3 获取 DSN

创建完成后，在 Settings → Client Keys (DSN) 中找到：
- **Backend DSN:** 类似 `https://xxx@o123456.ingest.sentry.io/123456`
- **Frontend DSN:** 类似 `https://yyy@o123456.ingest.sentry.io/789012`

**保存这两个 DSN，后面要用！**

---

## 第二步：后端集成（Node.js）

### 2.1 安装 Sentry SDK

```bash
cd lobster-circle-backend
npm install @sentry/node @sentry/profiling-node
```

### 2.2 配置 Sentry

在 `server.js` 顶部添加：

```javascript
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// Sentry 初始化（在其他 require 之前）
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    nodeProfilingIntegration(),
    // Express 集成（自动追踪 HTTP 请求）
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  // 性能监控配置
  tracesSampleRate: 0.1,  // 10% 的请求进行性能追踪
  profilesSampleRate: 0.1, // 10% 的请求进行性能分析
  
  // 错误过滤
  beforeSend(event, hint) {
    // 忽略某些无关紧要的错误
    if (event.exception) {
      const error = event.exception.values?.[0]?.value;
      if (error?.includes('ECONNRESET')) return null;
    }
    return event;
  },
  
  // 添加用户上下文
  beforeBreadcrumb(breadcrumb) {
    // 可以过滤或修改面包屑
    return breadcrumb;
  },
});

// 记录启动成功
Sentry.addBreadcrumb({
  category: 'startup',
  message: 'Server started successfully',
  level: 'info',
});
```

### 2.3 环境变量配置

在 `.env` 文件中添加：

```bash
# Sentry 配置
SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/123456
NODE_ENV=production  # 或 development
```

### 2.4 错误处理中间件

在 `middleware/errorHandler.js` 中集成 Sentry：

```javascript
const Sentry = require('@sentry/node');

const errorHandler = (err, req, res, next) => {
  // 记录错误到 Sentry
  Sentry.captureException(err, {
    extra: {
      userId: req.user?.id,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
    },
    tags: {
      error_type: err.name,
      route: req.route?.path || 'unknown',
    },
  });

  // 原有错误处理逻辑
  console.error(`[${new Date().toISOString()}] ${err.message}`);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
  });
};

module.exports = errorHandler;
```

### 2.5 关键操作添加面包屑

在重要业务逻辑中添加面包屑，方便追踪问题：

```javascript
const Sentry = require('@sentry/node');

// 用户登录
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User login attempt',
  data: { userId: user.id },
  level: 'info',
});

// 文件上传
Sentry.addBreadcrumb({
  category: 'upload',
  message: 'File uploaded',
  data: { 
    fileType: file.mimetype,
    size: file.size,
    userId: req.user.id,
  },
  level: 'info',
});

// 数据库操作
Sentry.addBreadcrumb({
  category: 'db',
  message: 'Database query',
  data: { model: 'User', operation: 'findOne' },
  level: 'info',
});
```

### 2.6 性能追踪（Transaction）

对关键 API 进行性能追踪：

```javascript
// 在路由中
app.get('/api/posts', async (req, res) => {
  const transaction = Sentry.startTransaction({
    op: 'http.server',
    name: 'GET /api/posts',
  });

  try {
    // 业务逻辑
    const posts = await Post.find();
    transaction.setStatus('ok');
    res.json({ success: true, data: posts });
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
});
```

---

## 第三步：前端集成（React Native）

### 3.1 安装 Sentry SDK

```bash
cd lobster-circle
npm install @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

### 3.2 配置 Sentry

在 `App.js` 顶部添加：

```javascript
import * as Sentry from '@sentry/react-native';

// Sentry 初始化（在 App 组件之前）
Sentry.init({
  dsn: 'YOUR_FRONTEND_DSN',
  environment: __DEV__ ? 'development' : 'production',
  
  // 性能监控
  tracesSampleRate: 0.1,
  
  // 错误过滤
  beforeSend(event, hint) {
    // 忽略开发环境的某些错误
    if (__DEV__) return null;
    return event;
  },
  
  // 添加设备信息
  beforeBreadcrumb(breadcrumb) {
    return breadcrumb;
  },
});
```

### 3.3 用户反馈集成

在设置页面添加用户反馈功能：

```javascript
import * as Sentry from '@sentry/react-native';

// 在反馈按钮点击时
const handleFeedback = () => {
  Sentry.showUserFeedback({
    onSubmit: (feedback) => {
      // 发送反馈
      console.log('Feedback submitted:', feedback);
    },
    onCancel: () => {
      console.log('Feedback cancelled');
    },
  });
};
```

---

## 第四步：配置告警规则

### 4.1 创建告警规则

在 Sentry 项目页面 → Alerts → Create Alert

**推荐告警规则：**

| 规则 | 条件 | 通知方式 |
|------|------|---------|
| 新错误类型 | 首次出现的错误 | 邮件 + Webhook |
| 错误率飙升 | 5 分钟内错误数 > 10 | 邮件 + Webhook |
| API 响应慢 | P95 > 2 秒 | 邮件 |
| 崩溃率超标 | 崩溃率 > 1% | 邮件 + Webhook |

### 4.2 配置通知渠道

1. 进入 Settings → Alert Rules
2. 添加通知方式：
   - Email（默认）
   - Slack/Discord（可选）
   - Webhook（集成到内部系统）

---

## 第五步：监控面板配置

### 5.1 创建 Performance 仪表板

在 Performance 页面创建自定义查询：

```
# 慢 API 查询
transaction.op:http.server transaction.duration:>1000

# 慢数据库查询
transaction.op:db transaction.duration:>500

# 错误率趋势
event.type:error
```

### 5.2 创建 Releases

每次部署后创建 Release：

```bash
# 使用 Sentry CLI
npx @sentry/cli releases new lobster-circle@3.2.0
npx @sentry/cli releases set-commits lobster-circle@3.2.0 --auto
npx @sentry/cli releases finalize lobster-circle@3.2.0
```

---

## 第六步：日常使用

### 6.1 查看错误

1. 进入 Issues 页面
2. 按严重程度排序
3. 点击错误查看详情：
   - 错误堆栈
   - 用户影响
   - 面包屑时间线
   - 设备/浏览器信息

### 6.2 分析性能

1. 进入 Performance 页面
2. 查看慢事务（Transactions）
3. 分析瓶颈：
   - 数据库查询
   - 外部 API 调用
   - 文件操作

### 6.3 追踪发布影响

1. 进入 Releases 页面
2. 对比不同版本的错误率
3. 查看新版本的 Adoptation

---

## 最佳实践

### ✅ 推荐

- 生产环境开启性能监控（tracesSampleRate: 0.1）
- 开发环境关闭错误上报（避免噪音）
- 为关键操作添加面包屑
- 定期审查和解决 Issues
- 设置合理的告警阈值

### ❌ 避免

- 不要在 Sentry 中记录敏感信息（密码、token）
- 不要开启 100% 采样率（成本高）
- 不要忽略所有 4xx 错误（有些需要关注）
- 不要在生产环境使用 development DSN

---

## 成本估算

Sentry 免费计划：
- 10,000 errors/month
- 10,000 transactions/month
- 7 天数据保留

对于初期项目完全够用，后期可升级到 Team 计划（$26/month）

---

## 故障排查

### 问题：错误没有上报

1. 检查 DSN 是否正确
2. 检查网络连接
3. 查看本地日志是否有 Sentry 错误
4. 检查 `beforeSend` 是否过滤了错误

### 问题：性能数据缺失

1. 确认 `tracesSampleRate > 0`
2. 检查 Transaction 是否正确 start/finish
3. 确认采样率不是太低

---

**配置完成后，龙虾圈就有了"眼睛"，任何问题都逃不过你的眼睛！** 🦞👁️
