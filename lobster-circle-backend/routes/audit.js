/**
 * 内容审核管理 API
 * 
 * GET    /api/audit          - 获取审核列表（管理员）
 * GET    /api/audit/stats    - 获取审核统计（管理员）
 * GET    /api/audit/pending  - 获取待审核内容（管理员）
 * POST   /api/audit/:id/process - 处理审核（管理员）
 * DELETE /api/audit/cleanup  - 清理旧日志（管理员）
 */

const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');

/**
 * 获取审核列表
 */
router.get('/', auth.required, async (req, res) => {
  try {
    // 检查管理员权限
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }

    const {
      page = 1,
      limit = 20,
      result,
      contentType,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    if (result) query.result = result;
    if (contentType) query.contentType = contentType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = parseInt(startDate);
      if (endDate) query.timestamp.$lte = parseInt(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'username avatar')
        .populate('processedBy', 'username'),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('[Audit API] 获取审核列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取审核列表失败',
    });
  }
});

/**
 * 获取审核统计
 */
router.get('/stats', auth.required, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }

    const { timeRange = '24h' } = req.query;
    const stats = await AuditLog.getAuditStats(timeRange);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Audit API] 获取统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计失败',
    });
  }
});

/**
 * 获取待审核内容
 */
router.get('/pending', auth.required, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }

    const { limit = 20 } = req.query;
    const pending = await AuditLog.getPendingReviews(parseInt(limit));

    res.json({
      success: true,
      data: {
        pending,
        count: pending.length,
      },
    });
  } catch (error) {
    console.error('[Audit API] 获取待审核内容失败:', error);
    res.status(500).json({
      success: false,
      message: '获取待审核内容失败',
    });
  }
});

/**
 * 处理审核（通过/拒绝）
 */
router.post('/:id/process', auth.required, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }

    const { id } = req.params;
    const { decision, note } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'decision 必须是 approve 或 reject',
      });
    }

    const result = await AuditLog.processAudit(id, decision, note || '', req.user._id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '审核记录不存在',
      });
    }

    res.json({
      success: true,
      message: `已${decision === 'approve' ? '通过' : '拒绝'}审核`,
      data: {
        id: result._id,
        decision,
      },
    });
  } catch (error) {
    console.error('[Audit API] 处理审核失败:', error);
    res.status(500).json({
      success: false,
      message: '处理审核失败',
    });
  }
});

/**
 * 清理旧日志
 */
router.delete('/cleanup', auth.required, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }

    const { daysToKeep = 90 } = req.query;
    const deletedCount = await AuditLog.cleanupOldLogs(parseInt(daysToKeep));

    res.json({
      success: true,
      message: `已清理 ${deletedCount} 条旧日志`,
      data: {
        deletedCount,
      },
    });
  } catch (error) {
    console.error('[Audit API] 清理日志失败:', error);
    res.status(500).json({
      success: false,
      message: '清理日志失败',
    });
  }
});

module.exports = router;
