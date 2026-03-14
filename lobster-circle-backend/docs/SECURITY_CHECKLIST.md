# 🦞 安全加固检查清单

## 概述

本检查清单用于确保龙虾圈后端和前端的安全性，防止常见安全漏洞。

---

## 一、依赖安全（立即执行）

### 1.1 漏洞扫描

```bash
# 后端依赖扫描
cd lobster-circle-backend
npm audit

# 自动修复（不破坏性更新）
npm audit fix

# 强制修复（可能破坏性更新，需测试）
npm audit fix --force

# 前端依赖扫描
cd lobster-circle
npm audit
```

### 1.2 定期扫描计划

```bash
# 添加到 crontab（每周执行）
0 2 * * 1 cd /path/to/lobster-circle-backend && npm audit --json > /var/log/npm-audit-$(date +\%Y-\%m-\%d).json
```

### 1.3 依赖锁定

✅ 已配置：`package-lock.json` 已存在
✅ 建议：使用 `npm ci` 代替 `npm install` 保证一致性

---

## 二、SQL/NoSQL 注入防护

### 2.1 MongoDB 注入防护

**风险：** 用户输入直接用于查询可能导致注入

**检查点：**

```javascript
// ❌ 危险：直接拼接查询
const user = await User.findOne({ username: req.body.username });

// ✅ 安全：使用参数化查询
const user = await User.findOne({ username: String(req.body.username) });

// ✅ 更安全：验证和清理输入
const { username } = req.body;
if (!username || typeof username !== 'string') {
  return res.status(400).json({ error: 'Invalid username' });
}
const user = await User.findOne({ username });
```

**检查清单：**
- [ ] 所有用户输入都经过类型验证
- [ ] 使用 Mongoose 的内置验证
- [ ] 避免使用 `$where` 操作符
- [ ] 避免使用 `mapReduce` 执行用户代码

### 2.2 验证中间件

✅ 已配置：`express-validator` 已安装

**使用示例：**

```javascript
const { body, validationResult } = require('express-validator');

router.post('/register',
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少 6 位'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // 处理注册逻辑
  }
);
```

---

## 三、XSS（跨站脚本）防护

### 3.1 后端防护

**检查点：**
- [ ] 所有用户输入经过 HTML 实体编码
- [ ] 使用 `helmet` 中间件设置安全头
- [ ] 禁用 `express` 的 `x-powered-by`

**配置：**

```javascript
const helmet = require('helmet');
app.use(helmet());
app.disable('x-powered-by');
```

### 3.2 前端防护（React Native）

**检查点：**
- [ ] 不使用 `dangerouslySetInnerHTML`
- [ ] 用户生成内容（UGC）显示时进行转义
- [ ] 避免在 URL 中直接使用用户输入

**使用示例：**

```javascript
// ❌ 危险
<Text>{userInput}</Text>  // 如果 userInput 包含特殊字符

// ✅ 安全（React Native 自动转义）
<Text>{String(userInput)}</Text>
```

---

## 四、CSRF（跨站请求伪造）防护

### 4.1 Token 验证

**检查点：**
- [ ] 敏感操作（删除、修改密码、转账）需要 CSRF Token
- [ ] 使用 `csurf` 中间件

**配置：**

```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// 保护敏感路由
router.post('/delete-account', csrfProtection, async (req, res) => {
  // 验证 CSRF Token
});
```

### 4.2 SameSite Cookie

✅ 已配置：JWT Token 不使用 Cookie

**建议：** 如果使用 Cookie，设置 SameSite：

```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
});
```

---

## 五、文件上传安全

### 5.1 文件类型验证

✅ 已配置：`multer` 文件过滤

**检查清单：**
- [ ] 限制允许的文件类型
- [ ] 限制文件大小
- [ ] 重命名上传文件
- [ ] 扫描恶意文件

**配置：**

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 使用随机文件名，防止覆盖和路径遍历
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  // 只允许图片
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
```

### 5.2 图片内容验证

**建议：** 使用 `sharp` 重新编码图片，去除元数据和潜在恶意代码

```javascript
const sharp = require('sharp');

// 处理上传的图片
await sharp(req.file.path)
  .resize(1920, 1920, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toFile(`processed/${req.file.filename}`);
```

---

## 六、认证安全

### 6.1 密码安全

✅ 已配置：`bcryptjs` 密码哈希

**检查清单：**
- [ ] 密码最小长度 6 位（建议 8 位）
- [ ] 使用 bcrypt 哈希（cost factor >= 10）
- [ ] 不存储明文密码
- [ ] 密码重置 Token 有过期时间

**配置：**

```javascript
const bcrypt = require('bcryptjs');

// 哈希密码（cost factor = 12）
const hashedPassword = await bcrypt.hash(password, 12);

// 验证密码
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 6.2 JWT Token 安全

✅ 已配置：JWT Token 认证

**检查清单：**
- [ ] Token 有过期时间（access token <= 24h）
- [ ] 使用强密钥（>= 32 字符）
- [ ] Token 不存储敏感信息
- [ ] 实现 Token 刷新机制

**配置：**

```javascript
const jwt = require('jsonwebtoken');

// 生成 Token（24 小时过期）
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// 验证 Token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
} catch (error) {
  // Token 无效或过期
}
```

### 6.3 登录保护

✅ 已配置：登录限流中间件

**检查清单：**
- [ ] 登录失败次数限制（5 次/小时）
- [ ] 失败后延迟响应
- [ ] 记录登录日志（IP、设备）
- [ ] 异常登录检测（新设备、新地点）

---

## 七、API 安全

### 7.1 速率限制

✅ 已配置：`express-rate-limit`

**检查清单：**
- [ ] 所有 API 有速率限制
- [ ] 敏感 API（登录、注册、密码重置）更严格的限制
- [ ] 按 IP 和用户分别限制

**配置：**

```javascript
const rateLimit = require('express-rate-limit');

// 通用限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 最多 100 请求
  message: '请求过于频繁，请稍后再试',
});

// 登录限制（更严格）
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 5, // 每个 IP 最多 5 次登录尝试
  message: '登录尝试次数过多，请稍后再试',
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
```

### 7.2 输入验证

✅ 已配置：`express-validator`

**检查清单：**
- [ ] 所有用户输入经过验证
- [ ] 使用白名单过滤
- [ ] 限制字符串长度
- [ ] 验证数据类型

---

## 八、敏感数据保护

### 8.1 数据加密

**检查清单：**
- [ ] 敏感数据（密码、Token）加密存储
- [ ] HTTPS 传输（生产环境）
- [ ] 日志中不记录敏感信息
- [ ] 数据库备份加密

### 8.2 环境变量

✅ 已配置：`.env` 文件

**检查清单：**
- [ ] `.env` 文件在 `.gitignore` 中
- [ ] 使用 `.env.example` 提供模板
- [ ] 生产环境使用密钥管理服务

---

## 九、内容安全

### 9.1 敏感词过滤

✅ 已配置：敏感词过滤中间件

**检查清单：**
- [ ] 用户生成内容经过敏感词过滤
- [ ] 支持正则匹配
- [ ] 支持自定义敏感词库
- [ ] 违规内容审核流程

### 9.2 内容审核

✅ 已配置：举报系统

**检查清单：**
- [ ] 用户可举报违规内容
- [ ] 管理员可审核和处理
- [ ] 自动检测违规图片（可集成第三方服务）

---

## 十、服务器安全

### 10.1 系统加固

**检查清单：**
- [ ] 使用非 root 用户运行 Node.js
- [ ] 限制文件权限（最小权限原则）
- [ ] 定期更新系统和依赖
- [ ] 关闭不必要的端口和服务

### 10.2 防火墙配置

**建议配置：**

```bash
# 只开放必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

---

## 十一、安全审计工具

### 11.1 自动化扫描

```bash
# 依赖审计
npm audit

# 代码安全扫描（安装 npm-audit-resolver）
npx npm-audit-resolver

# 静态代码分析（安装 eslint-plugin-security）
npm install -g eslint-plugin-security
eslint --plugin security .
```

### 11.2 定期渗透测试

**建议：** 每季度进行一次渗透测试

**检查项：**
- [ ] OWASP Top 10 漏洞
- [ ] 业务逻辑漏洞
- [ ] 权限绕过
- [ ] 数据泄露

---

## 十二、安全事件响应

### 12.1 应急响应流程

1. **发现安全事件**
   - 监控告警
   - 用户反馈
   - 自动化扫描

2. **初步评估**
   - 确定影响范围
   - 评估严重程度
   - 决定是否下线

3. **快速响应**
   - 修复漏洞
   - 重置受影响凭证
   - 通知用户（如需要）

4. **事后总结**
   - 记录事件经过
   - 更新安全策略
   - 防止再次发生

---

## 安全检查时间表

| 检查类型 | 频率 | 负责人 |
|---------|------|--------|
| 依赖审计 | 每周 | 自动 |
| 日志审查 | 每日 | 值班 |
| 安全扫描 | 每月 | 开发团队 |
| 渗透测试 | 每季度 | 外部团队 |
| 安全培训 | 每半年 | 全员 |

---

## 快速自查清单

### 上线前必须完成

- [ ] `npm audit` 无高危漏洞
- [ ] 所有 API 有速率限制
- [ ] 敏感操作有 CSRF 保护
- [ ] 文件上传有限制
- [ ] 密码使用 bcrypt 哈希
- [ ] JWT Token 有过期时间
- [ ] HTTPS 已配置（生产环境）
- [ ] `.env` 文件未提交到 Git
- [ ] 日志不记录敏感信息
- [ ] 错误信息不泄露堆栈（生产环境）

---

**安全无小事，定期检查，防患于未然！** 🦞🔒
