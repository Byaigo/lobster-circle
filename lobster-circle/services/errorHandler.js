/**
 * 错误处理服务 - 统一错误捕获和上报
 * 
 * 功能：
 * - 全局错误捕获
 * - 错误日志本地存储
 * - 错误上报后端 API
 * - 错误分类和去重
 */

import { Platform, NetInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { API_BASE_URL } from '../config';

// 错误存储键
const ERROR_STORAGE_KEY = '@lobster_error_logs';
const MAX_LOCAL_ERRORS = 50; // 本地最多存储 50 条错误

// 错误类型
export const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
  RENDER: 'RENDER_ERROR',
};

// 错误严重程度
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * 获取错误严重程度
 */
function getSeverity(errorType, errorMessage) {
  if (errorType === ErrorType.RENDER) return ErrorSeverity.CRITICAL;
  if (errorType === ErrorType.NETWORK) return ErrorSeverity.LOW;
  if (errorType === ErrorType.API) {
    if (errorMessage.includes('500') || errorMessage.includes('502')) {
      return ErrorSeverity.HIGH;
    }
    return ErrorSeverity.MEDIUM;
  }
  return ErrorSeverity.MEDIUM;
}

/**
 * 生成错误指纹（用于去重）
 */
function generateFingerprint(errorType, errorMessage, stackTrace) {
  const str = `${errorType}:${errorMessage}:${stackTrace?.split('\n')[0]}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 获取设备信息
 */
async function getDeviceInfo() {
  try {
    const networkState = await NetInfo.fetch();
    return {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      networkType: networkState.type,
      isConnected: networkState.isConnected,
      locale: Platform.constants?.locale || 'unknown',
      brand: Platform.constants?.Brand || 'unknown',
      model: Platform.constants?.Model || 'unknown',
    };
  } catch {
    return {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      networkType: 'unknown',
      isConnected: false,
      locale: 'unknown',
      brand: 'unknown',
      model: 'unknown',
    };
  }
}

/**
 * 获取用户信息（从本地存储）
 */
async function getUserInfo() {
  try {
    const token = await AsyncStorage.getItem('@lobster_token');
    const userId = await AsyncStorage.getItem('@lobster_user_id');
    return {
      userId: userId || 'anonymous',
      isAuthenticated: !!token,
    };
  } catch {
    return {
      userId: 'anonymous',
      isAuthenticated: false,
    };
  }
}

/**
 * 保存错误到本地存储
 */
async function saveErrorLocally(errorData) {
  try {
    const existing = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
    const errors = existing ? JSON.parse(existing) : [];
    
    // 检查是否重复
    const isDuplicate = errors.some(
      e => e.fingerprint === errorData.fingerprint &&
           Date.now() - e.timestamp < 3600000 // 1 小时内不重复
    );
    
    if (isDuplicate) {
      console.log('[ErrorHandler] 跳过重复错误:', errorData.fingerprint);
      return;
    }
    
    errors.unshift(errorData);
    
    // 限制存储数量
    if (errors.length > MAX_LOCAL_ERRORS) {
      errors.splice(MAX_LOCAL_ERRORS);
    }
    
    await AsyncStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
    console.log('[ErrorHandler] 错误已保存到本地');
  } catch (e) {
    console.error('[ErrorHandler] 保存本地错误失败:', e);
  }
}

/**
 * 上报错误到后端
 */
async function reportErrorToBackend(errorData) {
  try {
    const token = await AsyncStorage.getItem('@lobster_token');
    
    const response = await fetch(`${API_BASE_URL}/api/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(errorData),
    });
    
    if (response.ok) {
      console.log('[ErrorHandler] 错误已上报到后端');
      return true;
    } else {
      console.warn('[ErrorHandler] 上报失败:', response.status);
      return false;
    }
  } catch (e) {
    console.warn('[ErrorHandler] 上报异常:', e.message);
    return false;
  }
}

/**
 * 上报本地存储的错误（网络恢复时调用）
 */
export async function flushLocalErrors() {
  try {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log('[ErrorHandler] 网络未连接，跳过 flush');
      return;
    }
    
    const stored = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
    if (!stored) return;
    
    const errors = JSON.parse(stored);
    if (errors.length === 0) return;
    
    console.log('[ErrorHandler] 开始上报', errors.length, '条本地错误');
    
    const successIndices = [];
    for (let i = 0; i < errors.length; i++) {
      const reported = await reportErrorToBackend(errors[i]);
      if (reported) {
        successIndices.push(i);
      }
    }
    
    // 移除已上报的错误
    const remaining = errors.filter((_, i) => !successIndices.includes(i));
    await AsyncStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(remaining));
    
    console.log('[ErrorHandler] 上报完成，剩余', remaining.length, '条错误');
  } catch (e) {
    console.error('[ErrorHandler] flush 失败:', e);
  }
}

/**
 * 捕获并上报错误
 * 
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文信息
 * @param {string} context.component - 组件名称
 * @param {string} context.action - 操作名称
 * @param {Object} context.extra - 额外信息
 */
export async function captureError(error, context = {}) {
  console.error('[ErrorHandler] 捕获错误:', error);
  
  const errorType = error.type || ErrorType.UNKNOWN;
  const errorMessage = error.message || String(error);
  const stackTrace = error.stack || '';
  
  const [deviceInfo, userInfo] = await Promise.all([
    getDeviceInfo(),
    getUserInfo(),
  ]);
  
  const errorData = {
    type: errorType,
    message: errorMessage,
    stack: stackTrace,
    severity: getSeverity(errorType, errorMessage),
    fingerprint: generateFingerprint(errorType, errorMessage, stackTrace),
    timestamp: Date.now(),
    component: context.component || 'unknown',
    action: context.action || 'unknown',
    extra: context.extra || {},
    device: deviceInfo,
    user: userInfo,
    appVersion: '3.9.0',
    buildNumber: Platform.Version,
  };
  
  // 保存到本地
  await saveErrorLocally(errorData);
  
  // 尝试上报到后端
  await reportErrorToBackend(errorData);
  
  // 如果配置了 Sentry，也上报到 Sentry
  if (Sentry) {
    Sentry.captureException(error, {
      tags: {
        errorType,
        component: context.component,
        action: context.action,
      },
      extra: {
        ...context.extra,
        device: deviceInfo,
        user: userInfo,
      },
    });
  }
}

/**
 * 创建网络错误
 */
export function createNetworkError(message, url = null) {
  const error = new Error(message || '网络连接失败');
  error.type = ErrorType.NETWORK;
  error.url = url;
  return error;
}

/**
 * 创建 API 错误
 */
export function createApiError(message, statusCode = null, endpoint = null) {
  const error = new Error(message || 'API 请求失败');
  error.type = ErrorType.API;
  error.statusCode = statusCode;
  error.endpoint = endpoint;
  return error;
}

/**
 * 创建验证错误
 */
export function createValidationError(message, field = null) {
  const error = new Error(message || '验证失败');
  error.type = ErrorType.VALIDATION;
  error.field = field;
  return error;
}

/**
 * 创建权限错误
 */
export function createPermissionError(message, permission = null) {
  const error = new Error(message || '权限不足');
  error.type = ErrorType.PERMISSION;
  error.permission = permission;
  return error;
}

/**
 * 监听网络状态，网络恢复时上报错误
 */
export function setupNetworkListener() {
  return NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('[ErrorHandler] 网络已连接，开始上报错误');
      flushLocalErrors();
    }
  });
}

export default {
  captureError,
  createNetworkError,
  createApiError,
  createValidationError,
  createPermissionError,
  flushLocalErrors,
  setupNetworkListener,
  ErrorType,
  ErrorSeverity,
};
