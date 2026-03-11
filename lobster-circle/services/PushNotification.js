/**
 * 推送通知服务（前端集成）
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

class PushNotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  // 请求权限
  async requestPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      // 获取推送 Token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('获取推送权限失败:', error);
      return null;
    }
  }

  // 配置通知处理
  setupNotificationHandlers(onNotificationReceived, onNotificationTapped) {
    // 收到通知
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('收到通知:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // 点击通知
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('点击通知:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response.notification);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(this.notificationListener);
      Notifications.removeNotificationSubscription(this.responseListener);
    };
  }

  // 发送本地通知
  async scheduleLocalNotification(title, body, data = {}, delaySeconds = 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
    });
  }

  // 取消所有通知
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // 清理
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new PushNotificationService();
