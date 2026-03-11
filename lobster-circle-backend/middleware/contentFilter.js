const SystemConfig = require('../models/SystemConfig');
const SensitiveWord = require('../models/SensitiveWord');

// 内容过滤中间件
const contentFilter = async (req, res, next) => {
  try {
    // 获取配置
    const [enableFilter, allowPost] = await Promise.all([
      SystemConfig.findOne({ key: 'enable_sensitive_word_filter' }),
      SystemConfig.findOne({ key: 'allow_post' })
    ]);

    // 检查是否允许发帖
    if (allowPost && allowPost.value === false) {
      return res.status(403).json({ 
        error: '当前禁止发帖，请稍后再试',
        code: 'POST_DISABLED'
      });
    }

    // 检查请求体
    const { content } = req.body;
    
    if (content && enableFilter && enableFilter.value !== false) {
      // 敏感词检测
      const result = await checkSensitiveWords(content);
      
      if (result.hasSensitive) {
        if (result.action === 'block') {
          return res.status(400).json({
            error: '内容包含敏感词，请修改后重新提交',
            code: 'SENSITIVE_WORD_DETECTED',
            details: result.words
          });
        } else if (result.action === 'replace') {
          // 自动替换敏感词
          req.body.content = result.filteredContent;
        } else if (result.action === 'review') {
          // 标记为需要审核
          req.body.needsReview = true;
        }
      }
    }

    next();
  } catch (error) {
    console.error('内容过滤错误:', error);
    next(); // 出错时放过，不影响正常使用
  }
};

// 检查敏感词
async function checkSensitiveWords(content) {
  const sensitiveWords = await SensitiveWord.find({ isActive: true });
  
  let hasSensitive = false;
  let action = 'block';
  let words = [];
  let filteredContent = content;

  for (const sw of sensitiveWords) {
    const regex = new RegExp(sw.word, 'gi');
    if (regex.test(content)) {
      hasSensitive = true;
      words.push({ word: sw.word, category: sw.category, level: sw.level });
      
      // 确定最严格的操作
      if (sw.action === 'block') {
        action = 'block';
        break;
      } else if (sw.action === 'replace' && action !== 'block') {
        action = 'replace';
        filteredContent = filteredContent.replace(regex, sw.replaceWith);
      } else if (sw.action === 'review' && action !== 'block' && action !== 'replace') {
        action = 'review';
      }
    }
  }

  return {
    hasSensitive,
    action,
    words,
    filteredContent
  };
}

// 检查评论是否允许
const commentFilter = async (req, res, next) => {
  try {
    const allowComment = await SystemConfig.findOne({ key: 'allow_comment' });
    
    if (allowComment && allowComment.value === false) {
      return res.status(403).json({
        error: '当前禁止评论，请稍后再试',
        code: 'COMMENT_DISABLED'
      });
    }

    const { text } = req.body;
    
    if (text) {
      const result = await checkSensitiveWords(text);
      
      if (result.hasSensitive && result.action === 'block') {
        return res.status(400).json({
          error: '评论包含敏感词',
          code: 'SENSITIVE_WORD_DETECTED'
        });
      }
    }

    next();
  } catch (error) {
    console.error('评论过滤错误:', error);
    next();
  }
};

// 检查维护模式
const maintenanceCheck = async (req, res, next) => {
  try {
    const maintenance = await SystemConfig.findOne({ key: 'maintenance_mode' });
    
    // 管理员不受维护模式限制
    if (req.headers.authorization) {
      const adminAuth = require('./admin');
      try {
        await adminAuth(req, res, () => {});
        if (req.admin) return next();
      } catch (e) {}
    }

    if (maintenance && maintenance.value === true) {
      return res.status(503).json({
        error: '系统维护中，请稍后再试',
        code: 'MAINTENANCE_MODE'
      });
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  contentFilter,
  commentFilter,
  maintenanceCheck,
  checkSensitiveWords
};
