# 🦞 监控指标定义

## 概述

本文档定义龙虾圈后端需要监控的关键指标，帮助确保系统稳定性和性能。

---

## 核心指标（必须监控）

### 1. API 性能指标

| 指标 | 说明 | 告警阈值 | 测量方式 |
|------|------|---------|---------|
| **P95 响应时间** | 95% 请求的响应时间 | > 2 秒 | Sentry / 自定义 |
| **P99 响应时间** | 99% 请求的响应时间 | > 5 秒 | Sentry / 自定义 |
| **错误率** | HTTP 5xx 错误占比 | > 1% | Sentry |
| **请求量** | 每秒/分钟请求数 | 突增/突降 > 50% | 日志分析 |

### 2. 数据库指标

| 指标 | 说明 | 告警阈值 | 测量方式 |
|------|------|---------|---------|
| **慢查询数** | 执行时间 > 100ms 的查询 | > 10/分钟 | MongoDB Profiling |
| **连接数** | 活跃数据库连接数 | > 80% 上限 | MongoDB Stats |
| **查询失败率** | 查询错误占比 | > 0.5% | 日志分析 |

### 3. 业务指标

| 指标 | 说明 | 告警阈值 | 测量方式 |
|------|------|---------|---------|
| **登录失败率** | 登录失败次数占比 | > 20% | 日志分析 |
| **上传失败率** | 文件上传失败占比 | > 5% | 日志分析 |
| **消息发送失败率** | 私信发送失败占比 | > 2% | 日志分析 |
| **活跃用户数** | 每分钟活跃用户 | 突降 > 30% | 日志分析 |

### 4. 系统指标

| 指标 | 说明 | 告警阈值 | 测量方式 |
|------|------|---------|---------|
| **CPU 使用率** | 服务器 CPU 占用 | > 80% | 系统监控 |
| **内存使用率** | 服务器内存占用 | > 85% | 系统监控 |
| **磁盘使用率** | 磁盘空间占用 | > 80% | 系统监控 |
| **磁盘 I/O** | 磁盘读写速度 | 持续 > 90% | 系统监控 |

---

## 监控实现方案

### 方案 A：Sentry（推荐）

**适用：** 错误追踪 + 性能监控

**优点：**
- 开箱即用，配置简单
- 自动捕获错误和性能数据
- 内置告警和仪表板
- 支持分布式追踪

**配置：**
```javascript
// server.js
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% 采样
  profilesSampleRate: 0.1,
});
```

**监控指标：**
- ✅ 错误率和错误详情
- ✅ API 响应时间（P50/P75/P95/P99）
- ✅ 慢事务追踪
- ✅ 用户影响范围

---

### 方案 B：Prometheus + Grafana

**适用：** 全面的系统和业务监控

**优点：**
- 开源免费
- 高度可定制
- 强大的查询语言（PromQL）
- 丰富的图表和告警

**配置：**
```javascript
// 使用 prom-client 库
const client = require('prom-client');

// 创建指标
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// 在中间件中记录
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.path, res.statusCode)
      .observe(duration);
  });
  next();
});
```

---

### 方案 C：自定义日志分析

**适用：** 简单监控需求

**优点：**
- 无需额外依赖
- 完全控制
- 基于现有日志系统

**实现：**
```bash
# 每分钟统计错误数
ERROR_COUNT=$(grep -c '"level":"ERROR"' logs/app-$(date +%Y-%m-%d).log)

# 如果错误数超过阈值，发送告警
if [ $ERROR_COUNT -gt 100 ]; then
  echo "High error rate detected: $ERROR_COUNT" | mail -s "Alert: High Error Rate" admin@example.com
fi
```

---

## 告警规则配置

### Sentry 告警规则

#### 1. 新错误类型告警

**触发条件：** 首次出现的错误
**通知方式：** 邮件 + Webhook
**优先级：** 高

```
Alert: New Error Type Detected
- Error: {{ error.message }}
- First seen: {{ error.first_seen }}
- URL: {{ error.url }}
```

#### 2. 错误率飙升告警

**触发条件：** 5 分钟内错误数 > 10
**通知方式：** 邮件 + Webhook
**优先级：** 高

```
Alert: Error Rate Spike
- Error count: {{ error_count }} (threshold: 10)
- Time window: 5 minutes
- Affected users: {{ user_count }}
```

#### 3. API 响应慢告警

**触发条件：** P95 响应时间 > 2 秒
**通知方式：** 邮件
**优先级：** 中

```
Alert: Slow API Response
- Endpoint: {{ transaction.name }}
- P95 latency: {{ p95 }}s (threshold: 2s)
- Affected requests: {{ request_count }}
```

#### 4. 崩溃率超标告警

**触发条件：** 崩溃率 > 1%
**通知方式：** 邮件 + Webhook
**优先级：** 高

```
Alert: High Crash Rate
- Crash rate: {{ crash_rate }}% (threshold: 1%)
- Time window: 1 hour
- Affected users: {{ user_count }}
```

---

## 仪表板配置

### Sentry Performance 仪表板

创建以下查询：

#### 1. 慢 API Top 10

```
transaction.op:http.server
transaction.duration:>1000
```

按平均持续时间排序，显示 Top 10。

#### 2. 错误趋势图

```
event.type:error
```

按时间聚合，显示错误数量趋势。

#### 3. 数据库性能

```
transaction.op:db
transaction.duration:>100
```

显示慢查询列表。

#### 4. 用户影响

```
event.type:error
```

按用户数量分组，显示影响最大的错误。

---

## 监控检查清单

### 每日检查

- [ ] 查看 Sentry Issues 页面，解决新错误
- [ ] 检查错误率趋势是否正常
- [ ] 查看慢 API 列表，优化 Top 3

### 每周检查

- [ ] 分析性能趋势（对比上周）
- [ ] 检查告警规则是否需要调整
- [ ] 审查日志量，优化日志级别

### 每月检查

- [ ] 生成性能报告
- [ ] 审查监控指标是否覆盖全面
- [ ] 进行故障演练（模拟错误）

---

## 故障响应流程

### 1. 发现故障

- 收到告警通知
- 或用户反馈问题

### 2. 初步评估

- 查看 Sentry Issues
- 确认影响范围（用户数、功能）
- 判断严重程度

### 3. 快速响应

- **严重故障（核心功能不可用）：** 立即回滚或修复
- **一般故障（部分功能异常）：** 24 小时内修复
- **轻微故障（边缘问题）：** 纳入迭代修复

### 4. 问题解决

- 修复代码
- 测试验证
- 部署上线
- 监控确认

### 5. 事后总结

- 记录故障原因
- 更新故障处理文档
- 添加监控/告警防止复发

---

## 成本估算

### Sentry

| 计划 | 价格 | 包含 | 适用阶段 |
|------|------|------|---------|
| **Free** | $0 | 10K errors + 10K transactions | 初期 |
| **Team** | $26/m | 50K errors + 100K transactions | 成长期 |
| **Business** | $80/m | 200K errors + 500K transactions | 成熟期 |

### Prometheus + Grafana

- **软件成本：** $0（开源）
- **服务器成本：** 约 $10-20/月（单独服务器）
- **维护成本：** 需要专人维护

---

## 最佳实践

### ✅ 推荐

- 生产环境开启 Sentry 性能监控
- 设置合理的告警阈值（避免告警疲劳）
- 定期审查和解决 Issues
- 为关键业务指标设置告警
- 建立故障响应流程

### ❌ 避免

- 不要设置过多告警（会麻木）
- 不要忽略告警（会失去信任）
- 不要监控无关紧要的指标
- 不要在开发环境开启所有监控（成本高）

---

**监控不是目的，而是手段。目标是快速发现问题，减少用户影响！** 🦞👁️
