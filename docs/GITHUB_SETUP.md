# 🦞 龙虾圈 - GitHub 开源指南

## 📋 创建 GitHub 仓库步骤

### 1. 创建 GitHub 账号

如果你还没有 GitHub 账号：
1. 访问 https://github.com/
2. 点击 "Sign up"
3. 填写邮箱、密码
4. 验证邮箱
5. 设置用户名

### 2. 创建新仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 填写仓库信息：
   - **Repository name**: `lobster-circle`
   - **Description**: `🦞 龙虾圈 - 一个功能完整的社交应用（React Native + Node.js）`
   - **Public**: ✅ 选择公开仓库
   - **Initialize this repository with**: ❌ 不要勾选
4. 点击 "Create repository"

### 3. 上传项目到 GitHub

#### 方式一：使用 Git 命令行（推荐）

```bash
# 进入项目目录
cd C:\Users\Administrator\.openclaw\workspace\apps

# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "🎉 初始提交：龙虾圈社交应用 v3.2.0"

# 关联远程仓库（替换 yourusername 为你的 GitHub 用户名）
git remote add origin https://github.com/yourusername/lobster-circle.git

# 推送
git push -u origin main
```

如果遇到分支名称问题：
```bash
# 如果默认分支是 master 而不是 main
git branch -M main
git push -u origin main
```

#### 方式二：使用 GitHub Desktop

1. 下载 GitHub Desktop: https://desktop.github.com/
2. 安装并登录
3. 点击 "Add" → "Add Local Repository"
4. 选择项目文件夹
5. 点击 "Commit to main"
6. 点击 "Publish repository"

#### 方式三：直接上传（适合小文件）

1. 在仓库页面点击 "uploading an existing file"
2. 拖拽文件到页面
3. 填写提交信息
4. 点击 "Commit changes"

### 4. 配置仓库信息

#### 添加仓库描述

1. 进入仓库页面
2. 点击 "About" 右侧的齿轮图标
3. 填写：
   - **Website**: （可选）项目官网
   - **Topics**: 添加标签
     - `react-native`
     - `nodejs`
     - `social-app`
     - `expo`
     - `mongodb`
     - `chat-app`
     - `chinese`

#### 添加 README

仓库创建时会自动显示 README.md 的内容

#### 添加许可证

1. 点击 "Add file" → "Create new file"
2. 文件名：`LICENSE`
3. 内容已准备好（项目根目录有 LICENSE 文件）
4. 点击 "Commit new file"

### 5. 设置仓库保护（可选）

#### 分支保护

1. Settings → Branches → Add branch protection rule
2. Branch name pattern: `main`
3. 勾选：
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging

#### 问题模板

1. `.github/ISSUE_TEMPLATE/bug_report.md`
2. `.github/ISSUE_TEMPLATE/feature_request.md`

### 6. 启用 GitHub Pages（可选）

如果要展示项目网站：

1. Settings → Pages
2. Source: 选择 `main` 分支
3. Folder: 选择 `/ (root)`
4. Save

### 7. 添加协作者（可选）

1. Settings → Manage access
2. 点击 "Invite a collaborator"
3. 输入 GitHub 用户名或邮箱

---

## 🔒 安全注意事项

### 上传前检查

**不要上传以下文件：**

- ✅ `.env` 文件（包含敏感信息）
- ✅ `node_modules/`（依赖包）
- ✅ 个人账号密码
- ✅ API 密钥
- ✅ 数据库连接字符串

**已配置 `.gitignore` 自动忽略：**
- ✅ node_modules/
- ✅ .env
- ✅ .DS_Store
- ✅ 构建输出文件

### 敏感信息处理

**如果不小心上传了敏感信息：**

1. 立即删除文件
2. 修改相关密码/密钥
3. 使用 BFG 清理历史：
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch PATH_TO_FILE' \
     --prune-empty --tag-name-filter cat -- --all
   ```

---

## 📝 推荐的文件结构

```
lobster-circle/
├── .gitignore              ✅ 已准备
├── LICENSE                 ✅ 已准备
├── README.md               ✅ 已准备
├── lobster-circle/         ✅ 前端
├── lobster-circle-backend/ ✅ 后端
├── lobster-circle-admin/   ✅ 后台管理
└── docs/                   ✅ 文档
    ├── STARTUP_GUIDE.md
    ├── PROJECT_SUMMARY.md
    └── ...
```

---

## 🎯 上传后检查清单

- [ ] README.md 显示正常
- [ ] LICENSE 文件存在
- [ ] .gitignore 生效
- [ ] 没有敏感信息泄露
- [ ] 代码结构清晰
- [ ] 文档完整
- [ ] 可以正常克隆和运行

---

## 🚀 后续优化

### 1. 添加 GitHub Actions

创建 `.github/workflows/ci.yml` 实现自动测试：

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
      working-directory: ./lobster-circle-backend
    
    - name: Run tests
      run: npm test
      working-directory: ./lobster-circle-backend
```

### 2. 添加 Release

1. 点击 "Releases" → "Create a new release"
2. Tag version: `v3.2.0`
3. Release title: `v3.2.0 - 初始发布`
4. 描述更新内容
5. 点击 "Publish release"

### 3. 添加贡献指南

创建 `CONTRIBUTING.md`：

```markdown
# 贡献指南

感谢你对龙虾圈项目的兴趣！

## 如何贡献

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 代码规范

- 使用 ESLint
- 遵循 Airbnb 代码规范
- 编写测试用例

## 提交信息格式

- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具
```

---

## 📞 获取帮助

- **GitHub 文档**: https://docs.github.com/
- **Git 教程**: https://git-scm.com/book/zh/v2
- **项目问题**: 在 GitHub 提 Issue

---

**祝你开源顺利！** 🎉

**版本**: 3.2.0  
**更新时间**: 2026-03-11  
**开发者**: 🦞 龙虾助手
