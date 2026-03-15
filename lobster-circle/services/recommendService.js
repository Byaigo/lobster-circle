/**
 * 推荐服务
 * 
 * 功能：
 * - 推荐用户（基于关注/兴趣）
 * - 推荐动态（基于热度/时间）
 * - 热搜榜单
 * - 新人专区
 */

import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 获取推荐用户
 * 
 * @param {Object} options - 选项
 * @param {string} options.type - 推荐类型：hot(热门)/new(新人)/nearby(附近)
 * @param {number} options.limit - 数量限制
 * @param {number} options.page - 页码
 */
export async function getRecommendUsers(options = {}) {
  const {
    type = 'hot',
    limit = 20,
    page = 1,
  } = options;

  try {
    const token = await AsyncStorage.getItem('@lobster_token');
    const params = new URLSearchParams({
      type,
      limit,
      page,
    });

    const response = await fetch(`${API_BASE_URL}/api/recommend/users?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      return result.data;
    } else {
      // 降级：返回空数组
      return { users: [], hasMore: false };
    }
  } catch (error) {
    console.error('[RecommendService] 获取推荐用户失败:', error);
    return { users: [], hasMore: false };
  }
}

/**
 * 获取推荐动态
 * 
 * @param {Object} options - 选项
 * @param {string} options.type - 推荐类型：hot(热门)/latest(最新)/following(关注)
 * @param {number} options.limit - 数量限制
 * @param {number} options.page - 页码
 */
export async function getRecommendPosts(options = {}) {
  const {
    type = 'hot',
    limit = 20,
    page = 1,
  } = options;

  try {
    const token = await AsyncStorage.getItem('@lobster_token');
    const params = new URLSearchParams({
      type,
      limit,
      page,
    });

    const response = await fetch(`${API_BASE_URL}/api/recommend/posts?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      return result.data;
    } else {
      return { posts: [], hasMore: false };
    }
  } catch (error) {
    console.error('[RecommendService] 获取推荐动态失败:', error);
    return { posts: [], hasMore: false };
  }
}

/**
 * 获取热搜榜单
 * 
 * @param {string} timeRange - 时间范围：1h/24h/7d
 */
export async function getHotSearches(timeRange = '24h') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search/hot?timeRange=${timeRange}`);
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    } else {
      return { hashtags: [], users: [] };
    }
  } catch (error) {
    console.error('[RecommendService] 获取热搜失败:', error);
    return { hashtags: [], users: [] };
  }
}

/**
 * 关注用户
 */
export async function followUser(userId) {
  try {
    const token = await AsyncStorage.getItem('@lobster_token');
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[RecommendService] 关注失败:', error);
    return false;
  }
}

/**
 * 取消关注
 */
export async function unfollowUser(userId) {
  try {
    const token = await AsyncStorage.getItem('@lobster_token');
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/unfollow`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[RecommendService] 取消关注失败:', error);
    return false;
  }
}

/**
 * 记录用户行为（用于推荐算法）
 */
export async function trackUserAction(action, targetId, extra = {}) {
  try {
    const token = await AsyncStorage.getItem('@lobster_token');
    
    // 异步发送，不等待结果
    fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action,
        targetId,
        extra,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch (error) {
    // 忽略错误
  }
}

export default {
  getRecommendUsers,
  getRecommendPosts,
  getHotSearches,
  followUser,
  unfollowUser,
  trackUserAction,
};
