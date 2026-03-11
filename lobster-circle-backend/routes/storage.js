/**
 * 云存储上传 API
 */

const express = require('express');
const router = express.Router();
const qiniuService = require('../services/qiniuService');
const auth = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 临时存储配置
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 确保临时目录存在
if (!fs.existsSync('uploads/temp/')) {
  fs.mkdirSync('uploads/temp/', { recursive: true });
}

// 单图上传到七牛云
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const key = `lobster/${Date.now()}_${path.basename(req.file.originalname)}`;
    const result = await qiniuService.uploadFile(req.file.path, key);

    // 删除临时文件
    fs.unlinkSync(req.file.path);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// 多图上传到七牛云
router.post('/images', auth, upload.array('images', 9), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const key = `lobster/${Date.now()}_${path.basename(file.originalname)}`;
      const result = await qiniuService.uploadFile(file.path, key);
      // 删除临时文件
      fs.unlinkSync(file.path);
      return result;
    });

    const results = await Promise.all(uploadPromises);
    const successResults = results.filter(r => r.success);

    res.json({
      images: successResults.map(r => ({ url: r.url, key: r.key })),
      count: successResults.length,
      failed: results.length - successResults.length
    });
  } catch (error) {
    console.error('批量上传失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// 获取上传凭证（客户端直传七牛云）
router.get('/upload-token', auth, (req, res) => {
  try {
    const token = qiniuService.getUploadToken();
    res.json({
      token,
      domain: process.env.QINIU_DOMAIN,
      expires: 3600
    });
  } catch (error) {
    res.status(500).json({ error: '获取上传凭证失败' });
  }
});

module.exports = router;
