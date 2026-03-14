/**
 * 错误日志 API 路由
 * 
 * POST   /api/errors          - 上报错误
 * GET    /api/errors          - 获取错误列表（管理员）
 * GET    /api/errors/stats    - 获取错误统计（管理员）
 * PUT    /api/errors/resolve  - 标记错误为已解决（管理员）
 * DELETE /api/errors/cleanup  - 清理旧错误（管理员）
 */

const express = require('express');
const router = express.Router();
const ErrorLog = require('../models/ErrorLog');
const auth = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

/**
 * 上报错误
 * POST /api/errors
 */
router.post('/', rateLimit.create({ windowMs: 60000, max: 30 }), async (req, res) => {
  try {
    const errorData = req.body;
    
    // 验证必填字段
    if (!errorData.type || !errorData.message || !errorData.fingerprint) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：type, message, fingerprint',
      });
    }
    
    // 添加服务器时间戳
    errorData.serverTimestamp = Date.now();
    
    // 记录错误
    const errorLog = await ErrorLog.recordError(errorData);
    
    res.status(201).json({
      success: true,
      message: '错误已记录',
      data: {
        id: errorLog._id,
        fingerprint: errorLog.fingerprint,
      },
    });
  } catch (error) {
    console.error('[Errors API] 记录错误失败:', error);
    res.status(500).json({
      success: false,
      message: '记录错误失败',
    });
  }
});

/**
 * 获取错误列表（管理员）
 * GET /api/errors
 * 
 * 查询参数：
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 20）
 * - type: 错误类型过滤
 * - severity: 严重程度过滤
 * - isResolved: 是否已解决过滤
 * - component: 组件名称过滤
 * - startDate: 开始时间戳
 * - endDate: 结束时间戳
 */
router.get('/', auth.optional, async (req, res) => {
  try {
    // 检查管理员权限
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }
    
    const {
      page = 1,
      limit = 20,
      type,
      severity,
      isResolved,
      component,
      startDate,
      endDate,
      fingerprint,
    } = req.query;
    
    // 构建查询条件
    const query = {};
    
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (isResolved !== undefined) query.isResolved = isResolved === 'true';
    if (component) query.component = component;
    if (fingerprint) query.fingerprint = fingerprint;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = parseInt(startDate);
      if (endDate) query.timestamp.$lte = parseInt(endDate);
    }
    
    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询
    const [errors, total] = await Promise.all([
      ErrorLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('resolvedBy', 'username email'),
      ErrorLog.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      data: {
        errors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('[Errors API] 获取错误列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取错误列表失败',
    });
  }
});

/**
 * 获取错误统计
 * GET /api/errors/stats
 */
router.get('/stats', auth.optional, async (req, res) => {
  try {
    // 检查管理员权限
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }
    
    const { timeRange = '24h' } = req.query;
    
    const stats = await ErrorLog.getErrorStats(timeRange);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Errors API] 获取统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计失败',
    });
  }
});

/**
 * 获取单个错误详情
 * GET /api/errors/:id
 */
router.get('/:id', auth.optional, async (req, res) => {
  try {
    // 检查管理员权限
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }
    
    const errorLog = await ErrorLog.findById(req.params.id);
    
    if (!errorLog) {
      return res.status(404).json({
        success: false,
        message: '错误记录不存在',
      });
    }
    
    // 查找相同指纹的其他错误
    const relatedErrors = await ErrorLog.find({
      fingerprint: errorLog.fingerprint,
      _id: { $ne: errorLog._id },
    })
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        error: errorLog,
        relatedErrors,
      },
    });
  } catch (error) {
    console.error('[Errors API] 获取错误详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取错误详情失败',
    });
  }
});

/**
 * 标记错误为已解决
 * PUT /api/errors/resolve
 */
router.put('/resolve', auth.required, async (req, res) => {
  try {
    // 检查管理员权限
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }
    
    const { fingerprint, note } = req.body;
    
    if (!fingerprint) {
      return res.status(400).json({
        success: false,
        message: '缺少 fingerprint 参数',
      });
    }
    
    const result = await ErrorLog.resolveError(fingerprint, note || '', req.user._id);
    
    res.json({
      success: true,
      message: `已标记 ${result.modifiedCount} 条错误为已解决`,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('[Errors API] 标记错误失败:', error);
    res.status(500).json({
      success: false,
      message: '标记错误失败',
    });
  }
});

/**
 * 清理旧错误
 * DELETE /api/errors/cleanup
 */
router.delete('/cleanup', auth.required, async (req, res) => {
  try {
    // 检查管理员权限
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }
    
    const { daysToKeep = 30 } = req.query;
    
    const deletedCount = await ErrorLog.cleanupOldErrors(parseInt(daysToKeep));
    
    res.json({
      success: true,
      message: `已清理 ${deletedCount} 条旧错误`,
      data: {
        deletedCount,
      },
    });
  } catch (error) {
    console.error('[Errors API] 清理错误失败:', error);
    res.status(500).json({
      success: false,
      message: '清理错误失败',
    });
  }
});

/**
 * 批量标记错误
 * POST /api/errors/bulk-resolve
 */
router.post('/bulk-resolve', auth.required, async (req, res) => {
  try {
    // 检查管理员权限
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }
    
    const { fingerprints, note } = req.body;
    
    if (!Array.isArray(fingerprints) || fingerprints.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'fingerprints 必须是非空数组',
      });
    }
    
    let totalModified = 0;
    
    for (const fingerprint of fingerprints) {
      const result = await ErrorLog.resolveError(fingerprint, note || '', req.user._id);
      totalModified += result.modifiedCount;
    }
    
    res.json({
      success: true,
      message: `已标记 ${totalModified} 条错误为已解决`,
      data: {
        modifiedCount: totalModified,
      },
    });
  } catch (error) {
    console.error('[Errors API] 批量标记失败:', error);
    res.status(500).json({
      success: false,
      message: '批量标记失败',
    });
  }
});

module.exports = router;
