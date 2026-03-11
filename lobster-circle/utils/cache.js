/**
 * 缓存工具
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 分钟

// 获取缓存
export const getCache = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(`cache:${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    
    // 检查是否过期
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      await AsyncStorage.removeItem(`cache:${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('获取缓存失败:', error);
    return null;
  }
};

// 设置缓存
export const setCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(`cache:${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('设置缓存失败:', error);
  }
};

// 清除缓存
export const clearCache = async (key) => {
  try {
    if (key) {
      await AsyncStorage.removeItem(`cache:${key}`);
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
};
