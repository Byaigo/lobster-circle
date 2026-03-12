/**
 * 极光推送服务
 * 集成极光推送 SDK
 */

import { Platform } from 'react-native';
import JPush from 'jpush-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

class JPushService {
  constructor() {
    this.initialized = false;
    this.registrationId = null;
  }

  // 初始化
  async init() {
    if (this.initialized) return;

    try {
      // 初始化极光推送
      JPush.init({
        appKey: 'YOUR_JPUSH_APP_KEY', // 需要在 config.js 配置
        channel: 'lobster-circle',
        production: __DEV__ ? false : true,
      });

      // 获取 registrationId
      JPush.getRegistrationID((registrationId) => {
        this.registrationId = registrationId;
        console.log('Registration ID:', registrationId);
        this.uploadRegistrationId(registrationId);
      });

      // 监听通知点击
      JPush.addNotificationListener((notification) => {
        console.log('通知点击:', notification);
      });

      // 监听自定义消息
      JPush.addMessageListener((message) => {
        console.log('自定义消息:', message);
      });

      this.initialized = true;
      console.log('极光推送初始化成功');
    } catch (error) {
      console.error('极光推送初始化失败:', error);
    }
  }

  // 上传 registrationId 到后端
  async uploadRegistrationId(registrationId) {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_BASE_URL}/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ registrationId }),
      });
    } catch (error) {
      console.error('上传 registrationId 失败:', error);
    }
  }

  // 设置别名（用户 ID）
  async setAlias(userId) {
    try {
      JPush.setAlias({
        alias: userId,
        callback: (errorCode, result) => {
          if (errorCode === 0) {
            console.log('别名设置成功:', result);
          } else {
            console.error('别名设置失败:', errorCode);
          }
        },
      });
    } catch (error) {
      console.error('设置别名失败:', error);
    }
  }

  // 添加标签
  async addTag(tag) {
    try {
      JPush.addTags({
        tags: [tag],
        callback: (errorCode, result) => {
          if (errorCode === 0) {
            console.log('标签添加成功:', result);
          }
        },
      });
    } catch (error) {
      console.error('添加标签失败:', error);
    }
  }

  // 移除标签
  async removeTag(tag) {
    try {
      JPush.deleteTags({
        tags: [tag],
        callback: (errorCode, result) => {
          if (errorCode === 0) {
            console.log('标签移除成功:', result);
          }
        },
      });
    } catch (error) {
      console.error('移除标签失败:', error);
    }
  }

  // 清理
  cleanup() {
    JPush.removeNotificationListener();
    JPush.removeMessageListener();
  }
}

export default new JPushService();
