/**
 * 图片压缩中间件
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const QUALITY = 80;
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

// 图片压缩
const optimizeImage = async (filePath, options = {}) => {
  const {
    width = MAX_WIDTH,
    height = MAX_HEIGHT,
    quality = QUALITY,
    format = 'jpeg'
  } = options;

  const ext = path.extname(filePath).toLowerCase();
  const outputFormat = format || (ext === '.png' ? 'png' : 'jpeg');
  const outputPath = filePath.replace(/\.[^/.]+$/, `.${outputFormat}`);

  try {
    const metadata = await sharp(filePath).metadata();
    
    let pipeline = sharp(filePath);

    // 调整大小
    if (metadata.width > width || metadata.height > height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // 格式转换和压缩
    if (outputFormat === 'jpeg') {
      pipeline = pipeline.jpeg({ quality });
    } else if (outputFormat === 'png') {
      pipeline = pipeline.png({ quality });
    } else if (outputFormat === 'webp') {
      pipeline = pipeline.webp({ quality });
    }

    // 保存
    await pipeline.toFile(outputPath);

    // 删除原文件（如果格式不同）
    if (outputPath !== filePath) {
      fs.unlinkSync(filePath);
    }

    // 获取压缩后大小
    const stats = fs.statSync(outputPath);
    
    return {
      success: true,
      path: outputPath,
      size: stats.size,
      format: outputFormat
    };
  } catch (error) {
    console.error('图片压缩失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 验证图片
const validateImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = MAX_SIZE;

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: '只支持 JPG、PNG、GIF、WebP 格式'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `图片大小不能超过 ${MAX_SIZE / 1024 / 1024}MB`
    };
  }

  return { valid: true };
};

// 中间件
const imageUpload = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  const validation = validateImage(req.files[0]);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }

  next();
};

// 自动优化上传的图片
const autoOptimize = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const optimizedFiles = [];

    for (const file of req.files) {
      const result = await optimizeImage(file.path, {
        format: 'webp' // 默认转为 WebP 格式
      });

      if (result.success) {
        optimizedFiles.push({
          ...file,
          path: result.path,
          size: result.size,
          format: result.format
        });
      } else {
        optimizedFiles.push(file);
      }
    }

    req.files = optimizedFiles;
    next();
  } catch (error) {
    console.error('自动优化失败:', error);
    next();
  }
};

module.exports = {
  optimizeImage,
  validateImage,
  imageUpload,
  autoOptimize,
  MAX_SIZE,
  QUALITY
};
