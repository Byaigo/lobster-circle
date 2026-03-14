/**
 * 内容审核中间件
 * 
 * 在发布动态、评论、修改昵称等操作时自动进行内容审核
 */

const { auditImage, auditText, AuditResult, logAudit } = require('../services/contentAudit');

/**
 * 审核动态内容
 * 
 * 使用方法：
 * router.post('/', contentAudit.post, postsController.create);
 */
async function auditPost(req, res, next) {
  try {
    const { content, images } = req.body;
    const userId = req.user?._id;

    // 1. 审核文本
    if (content) {
      const textResult = await auditText(content);
      
      // 记录日志
      await logAudit(content, 'text', textResult, userId, { type: 'post' });
      
      // 如果审核不通过
      if (textResult.result === AuditResult.BLOCK) {
        return res.status(403).json({
          success: false,
          message: '内容包含敏感信息，无法发布',
          audit: {
            result: textResult.result,
            labels: textResult.labels,
            keywords: textResult.keywords,
          },
        });
      }
      
      // 如果需要人工审核
      if (textResult.result === AuditResult.REVIEW) {
        // 可以选择直接拒绝，或者先发布再标记为待审核
        // 这里选择先拒绝
        return res.status(403).json({
          success: false,
          message: '内容需要人工审核，请稍后重试',
          audit: {
            result: textResult.result,
            labels: textResult.labels,
          },
        });
      }
    }

    // 2. 审核图片
    if (images && images.length > 0) {
      for (const image of images) {
        const imageUrl = image.url || image;
        const imageResult = await auditImage(imageUrl);
        
        // 记录日志
        await logAudit(imageUrl, 'image', imageResult, userId, { type: 'post' });
        
        if (imageResult.result === AuditResult.BLOCK) {
          return res.status(403).json({
            success: false,
            message: '图片内容违规，无法发布',
            audit: {
              result: imageResult.result,
              labels: imageResult.labels,
            },
          });
        }
        
        if (imageResult.result === AuditResult.REVIEW) {
          return res.status(403).json({
            success: false,
            message: '图片需要人工审核，请稍后重试',
            audit: {
              result: imageResult.result,
            },
          });
        }
      }
    }

    // 审核通过，继续处理
    req.auditPassed = true;
    next();
  } catch (error) {
    console.error('[ContentAudit] 审核中间件错误:', error);
    
    // 审核服务异常时，根据配置决定是放行还是拒绝
    // 生产环境建议拒绝，开发环境可以放行
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        message: '审核服务暂时不可用，请稍后重试',
      });
    }
    
    // 开发环境放行
    req.auditPassed = true;
    next();
  }
}

/**
 * 审核评论内容
 */
async function auditComment(req, res, next) {
  try {
    const { content } = req.body;
    const userId = req.user?._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空',
      });
    }

    const textResult = await auditText(content);
    
    // 记录日志
    await logAudit(content, 'comment', textResult, userId, { type: 'comment' });
    
    if (textResult.result === AuditResult.BLOCK) {
      return res.status(403).json({
        success: false,
        message: '评论包含敏感信息，无法发布',
        audit: {
          result: textResult.result,
          labels: textResult.labels,
          keywords: textResult.keywords,
        },
      });
    }
    
    if (textResult.result === AuditResult.REVIEW) {
      return res.status(403).json({
        success: false,
        message: '评论需要人工审核',
        audit: {
          result: textResult.result,
        },
      });
    }

    req.auditPassed = true;
    next();
  } catch (error) {
    console.error('[ContentAudit] 评论审核错误:', error);
    
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        message: '审核服务暂时不可用',
      });
    }
    
    req.auditPassed = true;
    next();
  }
}

/**
 * 审核用户昵称
 */
async function auditNickname(req, res, next) {
  try {
    const { username } = req.body;
    const userId = req.user?._id;

    if (!username) {
      return next();
    }

    const textResult = await auditText(username);
    
    await logAudit(username, 'nickname', textResult, userId);
    
    if (textResult.result === AuditResult.BLOCK) {
      return res.status(403).json({
        success: false,
        message: '昵称包含敏感词，请更换其他昵称',
        audit: {
          result: textResult.result,
          keywords: textResult.keywords,
        },
      });
    }

    req.auditPassed = true;
    next();
  } catch (error) {
    console.error('[ContentAudit] 昵称审核错误:', error);
    req.auditPassed = true;
    next();
  }
}

/**
 * 审核个人简介
 */
async function auditBio(req, res, next) {
  try {
    const { bio } = req.body;
    const userId = req.user?._id;

    if (!bio) {
      return next();
    }

    const textResult = await auditText(bio);
    
    await logAudit(bio, 'bio', textResult, userId);
    
    if (textResult.result === AuditResult.BLOCK) {
      return res.status(403).json({
        success: false,
        message: '简介包含敏感信息',
        audit: {
          result: textResult.result,
          keywords: textResult.keywords,
        },
      });
    }

    req.auditPassed = true;
    next();
  } catch (error) {
    console.error('[ContentAudit] 简介审核错误:', error);
    req.auditPassed = true;
    next();
  }
}

/**
 * 批量审核（管理员接口）
 */
async function batchAudit(req, res, next) {
  // 管理员可以跳过审核
  if (req.user?.isAdmin) {
    req.auditPassed = true;
    return next();
  }
  
  // 根据内容类型选择审核方式
  const contentType = req.headers['x-content-type'] || 'post';
  
  switch (contentType) {
    case 'comment':
      return auditComment(req, res, next);
    case 'nickname':
      return auditNickname(req, res, next);
    case 'bio':
      return auditBio(req, res, next);
    default:
      return auditPost(req, res, next);
  }
}

module.exports = {
  auditPost,
  auditComment,
  auditNickname,
  auditBio,
  batchAudit,
};
