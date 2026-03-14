/**
 * 离线体验优化服务
 * 
 * 功能：
 * - 本地缓存动态列表
 * - 离线发布队列（网络恢复自动上传）
 * - 网络状态监听
 * - 缓存管理
 */

import { NetInfo, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { captureError, ErrorType } from './errorHandler';

// 存储键
const POSTS_CACHE_KEY = '@lobster_posts_cache';
const OFFLINE_QUEUE_KEY = '@lobster_offline_queue';
const CACHE_TIMESTAMP_KEY = '@lobster_cache_timestamp';

// 缓存配置
const MAX_CACHED_POSTS = 50; // 最多缓存 50 条动态
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 缓存有效期 5 分钟

// 网络状态订阅
let networkSubscription = null;
let networkListeners = [];

/**
 * 网络状态
 */
export const NetworkState = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown',
};

let currentNetworkState = NetworkState.UNKNOWN;

/**
 * 初始化网络监听
 */
export function initNetworkListener() {
  // 获取初始网络状态
  NetInfo.fetch().then(state => {
    currentNetworkState = state.isConnected ? NetworkState.ONLINE : NetworkState.OFFLINE;
    notifyNetworkChange(currentNetworkState);
  });

  // 监听网络变化
  networkSubscription = NetInfo.addEventListener(state => {
    const newState = state.isConnected ? NetworkState.ONLINE : NetworkState.OFFLINE;
    if (newState !== currentNetworkState) {
      currentNetworkState = newState;
      notifyNetworkChange(newState);
      
      // 网络恢复时处理离线队列
      if (newState === NetworkState.ONLINE) {
        flushOfflineQueue();
      }
    }
  });

  return () => {
    if (networkSubscription) {
      networkSubscription();
    }
  };
}

/**
 * 添加网络状态监听器
 */
export function addNetworkListener(listener) {
  networkListeners.push(listener);
  // 立即通知当前状态
  listener(currentNetworkState);
}

/**
 * 移除网络状态监听器
 */
export function removeNetworkListener(listener) {
  networkListeners = networkListeners.filter(l => l !== listener);
}

/**
 * 通知网络状态变化
 */
function notifyNetworkChange(state) {
  networkListeners.forEach(listener => listener(state));
}

/**
 * 检查是否在线
 */
export async function isOnline() {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
}

/**
 * 获取当前网络状态
 */
export function getNetworkState() {
  return currentNetworkState;
}

// ==================== 动态缓存 ====================

/**
 * 缓存动态列表
 */
export async function cachePosts(posts) {
  try {
    await AsyncStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(posts));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('[OfflineService] 已缓存', posts.length, '条动态');
  } catch (error) {
    console.error('[OfflineService] 缓存动态失败:', error);
  }
}

/**
 * 获取缓存的动态
 * @param {boolean} forceRefresh - 是否强制刷新（忽略缓存）
 */
export async function getCachedPosts(forceRefresh = false) {
  try {
    // 如果强制刷新，返回 null 表示需要重新加载
    if (forceRefresh) {
      return null;
    }

    // 检查缓存是否过期
    const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (timestampStr) {
      const timestamp = parseInt(timestampStr);
      const age = Date.now() - timestamp;
      
      if (age > CACHE_EXPIRY_MS) {
        console.log('[OfflineService] 缓存已过期');
        return null;
      }
    }

    // 获取缓存数据
    const postsStr = await AsyncStorage.getItem(POSTS_CACHE_KEY);
    if (!postsStr) {
      return null;
    }

    const posts = JSON.parse(postsStr);
    console.log('[OfflineService] 使用缓存，共', posts.length, '条动态');
    return posts;
  } catch (error) {
    console.error('[OfflineService] 获取缓存失败:', error);
    return null;
  }
}

/**
 * 清除动态缓存
 */
export async function clearPostsCache() {
  try {
    await AsyncStorage.multiRemove([POSTS_CACHE_KEY, CACHE_TIMESTAMP_KEY]);
    console.log('[OfflineService] 已清除缓存');
  } catch (error) {
    console.error('[OfflineService] 清除缓存失败:', error);
  }
}

/**
 * 追加新动态到缓存
 */
export async function appendPostToCache(post) {
  try {
    const postsStr = await AsyncStorage.getItem(POSTS_CACHE_KEY);
    const posts = postsStr ? JSON.parse(postsStr) : [];
    
    // 添加到开头
    posts.unshift(post);
    
    // 限制数量
    if (posts.length > MAX_CACHED_POSTS) {
      posts.splice(MAX_CACHED_POSTS);
    }
    
    await AsyncStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error('[OfflineService] 追加动态失败:', error);
  }
}

/**
 * 更新缓存中的动态
 */
export async function updatePostInCache(postId, updates) {
  try {
    const postsStr = await AsyncStorage.getItem(POSTS_CACHE_KEY);
    if (!postsStr) return;
    
    const posts = JSON.parse(postsStr);
    const index = posts.findIndex(p => p._id === postId);
    
    if (index !== -1) {
      posts[index] = { ...posts[index], ...updates };
      await AsyncStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(posts));
    }
  } catch (error) {
    console.error('[OfflineService] 更新动态失败:', error);
  }
}

// ==================== 离线发布队列 ====================

/**
 * 添加到离线队列
 */
export async function addToOfflineQueue(item) {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = queueStr ? JSON.parse(queueStr) : [];
    
    queue.push({
      ...item,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
    });
    
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log('[OfflineService] 已添加到离线队列，当前队列长度:', queue.length);
    
    return true;
  } catch (error) {
    console.error('[OfflineService] 添加到离线队列失败:', error);
    return false;
  }
}

/**
 * 获取离线队列
 */
export async function getOfflineQueue() {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueStr) return [];
    return JSON.parse(queueStr);
  } catch (error) {
    console.error('[OfflineService] 获取离线队列失败:', error);
    return [];
  }
}

/**
 * 处理离线队列（网络恢复时调用）
 */
export async function flushOfflineQueue() {
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) {
      console.log('[OfflineService] 离线队列为空');
      return;
    }

    console.log('[OfflineService] 开始处理离线队列，共', queue.length, '项');

    const failedItems = [];
    
    for (const item of queue) {
      try {
        const success = await processQueueItem(item);
        if (!success) {
          failedItems.push(item);
        }
      } catch (error) {
        console.error('[OfflineService] 处理队列项失败:', error);
        failedItems.push(item);
      }
    }

    // 保存失败的项（等待下次重试）
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems));
    
    if (failedItems.length < queue.length) {
      console.log(
        '[OfflineService] 处理完成，成功:',
        queue.length - failedItems.length,
        '失败:',
        failedItems.length
      );
    }
  } catch (error) {
    console.error('[OfflineService] 处理离线队列失败:', error);
  }
}

/**
 * 处理单个队列项
 */
async function processQueueItem(item) {
  const token = await AsyncStorage.getItem('@lobster_token');
  
  let endpoint;
  let method = 'POST';
  
  switch (item.type) {
    case 'post':
      endpoint = '/api/posts';
      break;
    case 'comment':
      endpoint = `/api/posts/${item.postId}/comments`;
      break;
    case 'like':
      endpoint = `/api/posts/${item.postId}/like`;
      method = 'POST';
      break;
    case 'unlike':
      endpoint = `/api/posts/${item.postId}/unlike`;
      method = 'POST';
      break;
    case 'favorite':
      endpoint = `/api/posts/${item.postId}/favorite`;
      method = 'POST';
      break;
    default:
      console.error('[OfflineService] 未知的队列类型:', item.type);
      return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item.data),
    });

    if (response.ok) {
      console.log('[OfflineService] 队列项处理成功:', item.type);
      return true;
    } else {
      console.warn('[OfflineService] 队列项处理失败:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[OfflineService] 队列项请求失败:', error);
    return false;
  }
}

/**
 * 离线发布动态
 */
export async function offlineCreatePost(content, images = []) {
  const offlinePost = {
    _id: `offline_${Date.now()}`,
    content,
    images,
    createdAt: Date.now(),
    isOffline: true,
    pending: true,
  };

  // 添加到本地缓存
  await appendPostToCache(offlinePost);

  // 添加到离线队列
  const queued = await addToOfflineQueue({
    type: 'post',
    data: { content, images },
    postId: offlinePost._id,
  });

  if (queued) {
    // 通知用户已加入队列
    captureError(
      new Error('网络不可用，动态已保存到草稿箱'),
      {
        component: 'offlineService',
        action: 'offlineCreatePost',
        extra: { hasImages: images.length > 0 },
      }
    );
  }

  return offlinePost;
}

/**
 * 离线评论
 */
export async function offlineCreateComment(postId, content) {
  const offlineComment = {
    _id: `offline_comment_${Date.now()}`,
    content,
    postId,
    createdAt: Date.now(),
    isOffline: true,
    pending: true,
  };

  await addToOfflineQueue({
    type: 'comment',
    postId,
    data: { content },
  });

  return offlineComment;
}

/**
 * 离线点赞
 */
export async function offlineToggleLike(postId, isLiked) {
  await addToOfflineQueue({
    type: isLiked ? 'like' : 'unlike',
    postId,
    data: {},
  });

  // 立即更新本地缓存
  await updatePostInCache(postId, {
    isLiked: !isLiked,
    likeCount: isLiked 
      ? (prev => (typeof prev === 'number' ? prev - 1 : prev))
      : (prev => (typeof prev === 'number' ? prev + 1 : prev)),
  });
}

/**
 * 离线收藏
 */
export async function offlineToggleFavorite(postId, isFavorited) {
  await addToOfflineQueue({
    type: 'favorite',
    postId,
    data: {},
  });

  await updatePostInCache(postId, {
    isFavorited: !isFavorited,
  });
}

/**
 * 获取离线队列状态
 */
export async function getQueueStatus() {
  const queue = await getOfflineQueue();
  const pendingCount = queue.filter(item => item.status === 'pending').length;
  const failedCount = queue.filter(item => item.status === 'failed').length;

  return {
    total: queue.length,
    pending: pendingCount,
    failed: failedCount,
    isOnline: currentNetworkState === NetworkState.ONLINE,
  };
}

/**
 * 清理离线队列
 */
export async function clearOfflineQueue() {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log('[OfflineService] 已清空离线队列');
  } catch (error) {
    console.error('[OfflineService] 清空队列失败:', error);
  }
}

// ==================== 导出 ====================

export default {
  // 网络状态
  initNetworkListener,
  addNetworkListener,
  removeNetworkListener,
  isOnline,
  getNetworkState,
  NetworkState,
  
  // 动态缓存
  cachePosts,
  getCachedPosts,
  clearPostsCache,
  appendPostToCache,
  updatePostInCache,
  
  // 离线队列
  addToOfflineQueue,
  getOfflineQueue,
  flushOfflineQueue,
  offlineCreatePost,
  offlineCreateComment,
  offlineToggleLike,
  offlineToggleFavorite,
  getQueueStatus,
  clearOfflineQueue,
};
