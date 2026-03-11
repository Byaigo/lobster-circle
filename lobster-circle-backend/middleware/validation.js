/**
 * 请求验证中间件
 */

const { body, param, query, validationResult } = require('express-validator');

// 验证结果处理
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      }
    });
  }
  next();
};

// 用户相关验证
const userValidation = {
  register: [
    body('username')
      .trim()
      .notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 2, max: 20 }).withMessage('用户名长度 2-20 个字符')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
    body('password')
      .notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6 }).withMessage('密码至少 6 个字符'),
    handleValidation
  ],
  
  login: [
    body('username')
      .trim()
      .notEmpty().withMessage('用户名不能为空'),
    body('password')
      .notEmpty().withMessage('密码不能为空'),
    handleValidation
  ],
  
  updateProfile: [
    body('bio')
      .optional()
      .isLength({ max: 100 }).withMessage('简介最多 100 个字符'),
    handleValidation
  ],
};

// 动态相关验证
const postValidation = {
  create: [
    body('content')
      .trim()
      .notEmpty().withMessage('内容不能为空')
      .isLength({ max: 1000 }).withMessage('内容最多 1000 个字符'),
    body('visibility')
      .optional()
      .isIn(['public', 'friends', 'private']).withMessage('可见性值无效'),
    body('images')
      .optional()
      .isArray({ max: 9 }).withMessage('最多上传 9 张图片'),
    handleValidation
  ],
  
  comment: [
    body('text')
      .trim()
      .notEmpty().withMessage('评论内容不能为空')
      .isLength({ max: 500 }).withMessage('评论最多 500 个字符'),
    handleValidation
  ],
  
  report: [
    body('reason')
      .notEmpty().withMessage('请选择举报原因')
      .isIn(['spam', 'harassment', 'hate_speech', 'violence', 'adult_content', 'fake_news', 'copyright', 'other'])
      .withMessage('举报原因无效'),
    body('description')
      .optional()
      .isLength({ max: 500 }).withMessage('描述最多 500 个字符'),
    handleValidation
  ],
};

// 好友相关验证
const friendValidation = {
  request: [
    body('receiverId')
      .notEmpty().withMessage('接收者 ID 不能为空')
      .isMongoId().withMessage('接收者 ID 格式无效'),
    body('message')
      .optional()
      .isLength({ max: 200 }).withMessage('消息最多 200 个字符'),
    handleValidation
  ],
};

// 消息相关验证
const messageValidation = {
  send: [
    body('to')
      .notEmpty().withMessage('接收者 ID 不能为空')
      .isMongoId().withMessage('接收者 ID 格式无效'),
    body('content')
      .trim()
      .notEmpty().withMessage('消息内容不能为空')
      .isLength({ max: 2000 }).withMessage('消息最多 2000 个字符'),
    body('type')
      .optional()
      .isIn(['text', 'image', 'emoji', 'system']).withMessage('消息类型无效'),
    handleValidation
  ],
};

// 分页验证
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须大于 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页数量 1-100'),
  handleValidation
];

module.exports = {
  handleValidation,
  userValidation,
  postValidation,
  friendValidation,
  messageValidation,
  paginationValidation,
};
