/**
 * 请求验证中间件
 */

const { AppError } = require('./errorHandler');

// 验证规则
const validators = {
  // 字符串
  string: (value, options = {}) => {
    if (typeof value !== 'string') {
      throw AppError.badRequest('必须是字符串类型');
    }
    if (options.minLength && value.length < options.minLength) {
      throw AppError.badRequest(`最小长度${options.minLength}`);
    }
    if (options.maxLength && value.length > options.maxLength) {
      throw AppError.badRequest(`最大长度${options.maxLength}`);
    }
    if (options.pattern && !options.pattern.test(value)) {
      throw AppError.badRequest('格式不正确');
    }
    return value.trim();
  },

  // 数字
  number: (value, options = {}) => {
    const num = Number(value);
    if (isNaN(num)) {
      throw AppError.badRequest('必须是数字');
    }
    if (options.min !== undefined && num < options.min) {
      throw AppError.badRequest(`最小值${options.min}`);
    }
    if (options.max !== undefined && num > options.max) {
      throw AppError.badRequest(`最大值${options.max}`);
    }
    if (options.integer && !Number.isInteger(num)) {
      throw AppError.badRequest('必须是整数');
    }
    return num;
  },

  // 布尔值
  boolean: (value) => {
    if (typeof value !== 'boolean') {
      throw AppError.badRequest('必须是布尔值');
    }
    return value;
  },

  // 数组
  array: (value, options = {}) => {
    if (!Array.isArray(value)) {
      throw AppError.badRequest('必须是数组');
    }
    if (options.minLength && value.length < options.minLength) {
      throw AppError.badRequest(`最少${options.minLength}项`);
    }
    if (options.maxLength && value.length > options.maxLength) {
      throw AppError.badRequest(`最多${options.maxLength}项`);
    }
    return value;
  },

  // 对象 ID
  objectId: (value) => {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw AppError.badRequest('无效的 ID');
    }
    return value;
  },

  // 邮箱
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw AppError.badRequest('邮箱格式不正确');
    }
    return value.toLowerCase().trim();
  },

  // 手机号
  phone: (value) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(value)) {
      throw AppError.badRequest('手机号格式不正确');
    }
    return value;
  },

  // 枚举
  enum: (value, allowedValues) => {
    if (!allowedValues.includes(value)) {
      throw AppError.badRequest(`必须是以下值之一：${allowedValues.join(', ')}`);
    }
    return value;
  }
};

// 创建验证中间件
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = {};

      // 验证 query
      if (schema.query) {
        validatedData.query = validateData(req.query, schema.query);
      }

      // 验证 body
      if (schema.body) {
        validatedData.body = validateData(req.body, schema.body);
      }

      // 验证 params
      if (schema.params) {
        validatedData.params = validateData(req.params, schema.params);
      }

      // 附加验证后的数据
      req.validated = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// 验证数据
const validateData = (data, schema) => {
  const result = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // 必填字段
    if (rules.required && (value === undefined || value === null || value === '')) {
      throw AppError.badRequest(`${field} 是必填项`);
    }

    // 可选字段且为空
    if (value === undefined || value === null || value === '') {
      if (rules.default !== undefined) {
        result[field] = rules.default;
      }
      continue;
    }

    // 类型验证
    const validator = validators[rules.type];
    if (!validator) {
      throw new Error(`未知的验证类型：${rules.type}`);
    }

    result[field] = validator(value, rules.options);
  }

  return result;
};

// 快捷验证函数
const validateQuery = (schema) => validate({ query: schema });
const validateBody = (schema) => validate({ body: schema });
const validateParams = (schema) => validate({ params: schema });

module.exports = {
  validators,
  validate,
  validateQuery,
  validateBody,
  validateParams
};
