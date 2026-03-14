/**
 * 内容审核服务
 * 
 * 功能：
 * - AI 图片鉴黄（集成阿里云内容安全）
 * - AI 文本审核（敏感词 + AI 语义分析）
 * - 自动打标和分级
 * - 审核日志记录
 */

const axios = require('axios');
const crypto = require('crypto');

// 配置（从环境变量读取）
const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID;
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET;
const ALIYUN_REGION = process.env.ALIYUN_REGION || 'cn-shanghai';

// 审核结果类型
const AuditResult = {
  PASS: 'pass',      // 通过
  REVIEW: 'review',  // 需要人工审核
  BLOCK: 'block',    // 直接屏蔽
};

// 违规类型
const ViolationType = {
  PORNOGRAPHY: 'pornography',     // 色情
  VIOLENCE: 'violence',           // 暴力
  POLITICS: 'politics',           // 政治敏感
  ADVERTISING: 'advertising',     // 广告
  SPAM: 'spam',                   // 垃圾内容
  ABUSE: 'abuse',                 // 辱骂
  CUSTOM: 'custom',               // 自定义敏感词
};

/**
 * 阿里云内容安全 - 图片鉴黄
 * 
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise<{result: string, confidence: number, labels: string[]}>}
 */
async function auditImage(imageUrl) {
  // 如果没有配置阿里云密钥，返回通过
  if (!ALIYUN_ACCESS_KEY_ID || !ALIYUN_ACCESS_KEY_SECRET) {
    console.log('[ContentAudit] 未配置阿里云，跳过图片审核');
    return {
      result: AuditResult.PASS,
      confidence: 1.0,
      labels: [],
      message: '未配置阿里云服务',
    };
  }

  try {
    // 构建请求
    const endpoint = `https://green-cip.${ALIYUN_REGION}.aliyuncs.com/green/image/scan`;
    const tasks = [{
      data: {
        url: imageUrl,
      },
      scene: 'porn',
    }];

    const requestBody = JSON.stringify({
      scenes: ['porn'],
      tasks,
    });

    // 生成签名
    const headers = generateAliyunHeaders(requestBody, endpoint);

    const response = await axios.post(endpoint, requestBody, {
      headers,
      timeout: 5000,
    });

    if (response.data.code === 200) {
      const taskResult = response.data.data[0]?.results?.[0];
      
      if (taskResult) {
        const suggestion = taskResult.suggestion; // pass/review/block
        const rate = taskResult.rate || 0;
        const label = taskResult.label;

        // 映射结果
        const result = mapSuggestion(suggestion);
        
        console.log(`[ContentAudit] 图片审核结果：${result}, 置信度：${rate}, 标签：${label}`);

        return {
          result,
          confidence: rate,
          labels: label ? [label] : [],
          message: `图片审核${result === AuditResult.PASS ? '通过' : '未通过'}`,
        };
      }
    }

    return {
      result: AuditResult.REVIEW,
      confidence: 0,
      labels: [],
      message: '阿里云响应异常，需要人工审核',
    };
  } catch (error) {
    console.error('[ContentAudit] 图片审核失败:', error.message);
    
    // 服务异常时，根据错误类型决定
    if (error.response?.status === 400) {
      return {
        result: AuditResult.BLOCK,
        confidence: 1.0,
        labels: ['error'],
        message: '图片格式错误或无法访问',
      };
    }
    
    return {
      result: AuditResult.REVIEW,
      confidence: 0,
      labels: [],
      message: '审核服务异常，需要人工审核',
    };
  }
}

/**
 * 文本审核
 * 
 * @param {string} text - 待审核文本
 * @returns {Promise<{result: string, confidence: number, labels: string[], keywords: string[]}>}
 */
async function auditText(text) {
  if (!text || text.trim().length === 0) {
    return {
      result: AuditResult.PASS,
      confidence: 1.0,
      labels: [],
      keywords: [],
      message: '空文本',
    };
  }

  const results = [];

  // 1. 敏感词检测
  const sensitiveResult = await auditSensitiveWords(text);
  if (sensitiveResult.result === AuditResult.BLOCK) {
    results.push(sensitiveResult);
  }

  // 2. AI 语义分析（如果配置了阿里云）
  if (ALIYUN_ACCESS_KEY_ID && ALIYUN_ACCESS_KEY_SECRET) {
    const aiResult = await auditTextAI(text);
    if (aiResult.result !== AuditResult.PASS) {
      results.push(aiResult);
    }
  }

  // 合并结果
  if (results.length === 0) {
    return {
      result: AuditResult.PASS,
      confidence: 1.0,
      labels: [],
      keywords: [],
      message: '文本审核通过',
    };
  }

  // 只要有 BLOCK 结果，就返回 BLOCK
  const hasBlock = results.some(r => r.result === AuditResult.BLOCK);
  const hasReview = results.some(r => r.result === AuditResult.REVIEW);

  const allLabels = [...new Set(results.flatMap(r => r.labels))];
  const allKeywords = [...new Set(results.flatMap(r => r.keywords || []))];

  return {
    result: hasBlock ? AuditResult.BLOCK : (hasReview ? AuditResult.REVIEW : AuditResult.PASS),
    confidence: Math.min(...results.map(r => r.confidence)),
    labels: allLabels,
    keywords: allKeywords,
    message: `文本审核${hasBlock ? '未通过' : '需要人工审核'}`,
  };
}

/**
 * 敏感词检测
 */
async function auditSensitiveWords(text) {
  // 这里应该从数据库加载敏感词列表
  // 为了演示，使用简单的硬编码
  const sensitiveWords = [
    // 政治敏感
    '敏感词 1', '敏感词 2',
    // 色情
    '色情词 1', '色情词 2',
    // 暴力
    '暴力词 1',
    // 广告
    '加微信', 'QQ 群', '公众号',
  ];

  const foundWords = [];
  const lowerText = text.toLowerCase();

  for (const word of sensitiveWords) {
    if (lowerText.includes(word.toLowerCase())) {
      foundWords.push(word);
    }
  }

  if (foundWords.length > 0) {
    return {
      result: AuditResult.BLOCK,
      confidence: 1.0,
      labels: [ViolationType.CUSTOM],
      keywords: foundWords,
      message: `包含敏感词：${foundWords.join(', ')}`,
    };
  }

  return {
    result: AuditResult.PASS,
    confidence: 1.0,
    labels: [],
    keywords: [],
    message: '敏感词检测通过',
  };
}

/**
 * AI 文本语义分析（阿里云）
 */
async function auditTextAI(text) {
  try {
    const endpoint = `https://green-cip.${ALIYUN_REGION}.aliyuncs.com/green/text/scan`;
    
    const tasks = [{
      content: text,
      dataId: `text_${Date.now()}`,
    }];

    const requestBody = JSON.stringify({
      scenes: ['antispam'],
      tasks,
    });

    const headers = generateAliyunHeaders(requestBody, endpoint);

    const response = await axios.post(endpoint, requestBody, {
      headers,
      timeout: 5000,
    });

    if (response.data.code === 200) {
      const taskResult = response.data.data[0]?.results?.[0];
      
      if (taskResult) {
        const suggestion = taskResult.suggestion;
        const rate = taskResult.rate || 0;
        const label = taskResult.label;
        const details = taskResult.details || [];

        const result = mapSuggestion(suggestion);
        const keywords = details.flatMap(d => d.keywords || []);

        console.log(`[ContentAudit] 文本 AI 审核结果：${result}, 置信度：${rate}`);

        return {
          result,
          confidence: rate,
          labels: label ? [label] : [],
          keywords,
          message: `文本 AI 审核${result === AuditResult.PASS ? '通过' : '未通过'}`,
        };
      }
    }

    return {
      result: AuditResult.REVIEW,
      confidence: 0,
      labels: [],
      keywords: [],
      message: 'AI 审核响应异常',
    };
  } catch (error) {
    console.error('[ContentAudit] 文本 AI 审核失败:', error.message);
    
    return {
      result: AuditResult.REVIEW,
      confidence: 0,
      labels: [],
      keywords: [],
      message: 'AI 审核服务异常',
    };
  }
}

/**
 * 生成阿里云签名头
 */
function generateAliyunHeaders(body, endpoint) {
  const method = 'POST';
  const accept = 'application/json';
  const contentType = 'application/json';
  const date = new Date().toUTCString();
  const nonce = crypto.randomUUID();

  // 计算签名
  const stringToSign = `${method}\n${accept}\n${contentType}\n${date}\n${nonce}\n${getAliyunHeaders()}\n${new URL(endpoint).pathname}`;
  const signature = crypto
    .createHmac('sha1', ALIYUN_ACCESS_KEY_SECRET)
    .update(stringToSign)
    .digest('base64');

  return {
    'Authorization': `ACS ${ALIYUN_ACCESS_KEY_ID}:${signature}`,
    'Content-Type': contentType,
    'Accept': accept,
    'Date': date,
    'x-acs-nonce': nonce,
    ...getAliyunHeaders(),
  };
}

/**
 * 获取阿里云自定义头
 */
function getAliyunHeaders() {
  return {
    'x-acs-version': '2018-05-09',
    'x-acs-region': ALIYUN_REGION,
  };
}

/**
 * 映射阿里云建议到内部结果
 */
function mapSuggestion(suggestion) {
  switch (suggestion) {
    case 'pass':
      return AuditResult.PASS;
    case 'review':
      return AuditResult.REVIEW;
    case 'block':
      return AuditResult.BLOCK;
    default:
      return AuditResult.REVIEW;
  }
}

/**
 * 记录审核日志
 */
async function logAudit(content, contentType, result, userId, extra = {}) {
  const AuditLog = require('../models/AuditLog');
  
  try {
    await AuditLog.create({
      content: contentType === 'image' ? '[图片]' : content?.substring(0, 500),
      contentType,
      result: result.result,
      confidence: result.confidence,
      labels: result.labels,
      keywords: result.keywords,
      userId,
      extra,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[ContentAudit] 记录审核日志失败:', error);
  }
}

module.exports = {
  auditImage,
  auditText,
  AuditResult,
  ViolationType,
  logAudit,
};
