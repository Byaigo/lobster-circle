# 🦞 七牛云 CDN 配置指南

## 1. 注册七牛云账号

1. 访问 https://www.qiniu.com
2. 注册账号并完成实名认证
3. 进入控制台：https://portal.qiniu.com

---

## 2. 创建对象存储 Bucket

### 步骤：
1. 进入 **对象存储** → **Bucket 管理**
2. 点击 **创建 Bucket**
3. 配置：
   - **Bucket 名称**：`lobster-circle`（全局唯一）
   - **所属区域**：选择离用户最近的区域（如：华东、华南）
   - **访问控制**：公开读（推荐）
   - **CDN 加速**：启用（推荐）

4. 创建完成后记录：
   - Bucket 名称
   - 访问域名（如：`https://cdn.example.com` 或 `https://lobster-circle.qiniudn.com`）

---

## 3. 获取密钥

1. 进入 **个人中心** → **密钥管理**
2. 查看或创建 **AccessKey** 和 **SecretKey**
3. 复制保存（只显示一次）

---

## 4. 配置环境变量

### 复制 `.env.example` 为 `.env`：
```bash
cd lobster-circle-backend
copy .env.example .env
```

### 编辑 `.env` 文件：
```env
# ==================== 七牛云配置 ====================
QINIU_ACCESS_KEY=your_access_key_here
QINIU_SECRET_KEY=your_secret_key_here
QINIU_BUCKET=lobster-circle
QINIU_DOMAIN=https://your-cdn-domain.com
```

**参数说明：**
- `QINIU_ACCESS_KEY`：七牛云 AccessKey
- `QINIU_SECRET_KEY`：七牛云 SecretKey
- `QINIU_BUCKET`：你的 Bucket 名称
- `QINIU_DOMAIN`：CDN 域名（带 https://）

---

## 5. 配置自定义域名（可选）

### 如果使用七牛云默认域名：
```env
QINIU_DOMAIN=https://lobster-circle.qiniudn.com
```

### 如果使用自定义域名：
1. 在七牛云控制台绑定域名
2. 配置 CNAME 解析
3. 配置 HTTPS 证书（七牛云提供）
4. 更新 `.env`：
```env
QINIU_DOMAIN=https://cdn.yourdomain.com
```

---

## 6. 测试上传

### 启动后端服务器：
```bash
npm run dev
```

### 使用 Postman 或 curl 测试：
```bash
curl -X POST http://localhost:3000/api/storage/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### 预期响应：
```json
{
  "success": true,
  "url": "https://your-cdn-domain.com/lobster/1234567890_image.jpg",
  "key": "lobster/1234567890_image.jpg",
  "hash": "Fl8xXxXxXxXxXxXxXxXxXxXxXxXx"
}
```

---

## 7. 前端使用

### 单图上传：
```javascript
import api from './api';

const uploadImage = async (uri) => {
  try {
    const result = await api.upload.uploadImage(uri);
    console.log('上传成功:', result.url);
    return result.url;
  } catch (error) {
    console.error('上传失败:', error);
  }
};
```

### 多图上传：
```javascript
const uploadImages = async (uris) => {
  try {
    const result = await api.upload.uploadImages(uris);
    console.log('上传成功:', result.images);
    return result.images.map(img => img.url);
  } catch (error) {
    console.error('上传失败:', error);
  }
};
```

---

## 8. 费用说明

### 免费版额度（个人认证）：
- 存储空间：10GB
- 月流量：10GB
- 月请求数：100 万次

### 企业认证：
- 存储空间：100GB
- 月流量：100GB
- 月请求数：1000 万次

### 参考价格：
- 存储：0.148 元/GB/月
- 流量：0.24 元/GB
- 请求：0.01 元/万次

---

## 9. 安全建议

### 1. 密钥安全：
- ✅ 不要将 `.env` 提交到 Git
- ✅ 使用环境变量管理密钥
- ✅ 定期轮换密钥

### 2. 防盗链：
在七牛云控制台配置 **Referer 防盗链**：
- 允许空 Referer（App 请求）
- 添加允许的域名白名单

### 3. 访问控制：
- 使用私有 Bucket + 上传凭证模式
- 设置凭证有效期（默认 1 小时）
- 限制上传文件大小（已配置 50MB）

---

## 10. 故障排查

### 问题：上传失败 401
**原因**：密钥配置错误  
**解决**：检查 `.env` 中的 `QINIU_ACCESS_KEY` 和 `QINIU_SECRET_KEY`

### 问题：上传失败 403
**原因**：Bucket 权限不足  
**解决**：检查 Bucket 是否为公开读，或密钥是否有写权限

### 问题：CDN 域名无法访问
**原因**：域名未备案或 CDN 未配置  
**解决**：完成域名备案，或在七牛云控制台配置 CDN

---

## 11. 相关 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/storage/image` | POST | 单图上传（服务器中转） |
| `/api/storage/images` | POST | 多图上传（服务器中转） |
| `/api/storage/upload-token` | GET | 获取上传凭证（客户端直传） |

---

**配置完成后，重启后端服务器即可生效！** 🚀
