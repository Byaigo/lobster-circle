/**
 * 版本更新检查组件
 */

import React, { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 小时检查一次

export default function UpdateCheck({ children }) {
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    checkUpdate();
  }, []);

  const checkUpdate = async () => {
    try {
      // 检查上次检查时间
      const lastCheckStr = await AsyncStorage.getItem('lastUpdateCheck');
      const now = Date.now();

      if (lastCheckStr) {
        const lastCheckTime = parseInt(lastCheckStr);
        if (now - lastCheckTime < UPDATE_CHECK_INTERVAL) {
          return; // 24 小时内不重复检查
        }
      }

      // 获取当前版本
      const currentVersion = Application.nativeApplicationVersion || '1.0.0';

      // 检查更新
      const response = await fetch(`${API_BASE_URL}/version/check?version=${currentVersion}`);
      const data = await response.json();

      // 保存检查时间
      await AsyncStorage.setItem('lastUpdateCheck', now.toString());

      // 强制更新
      if (data.forceUpdate) {
        Alert.alert(
          '版本更新',
          `发现新版本 ${data.latest}，请更新后继续使用。\n\n${data.updateNote}`,
          [
            {
              text: '立即更新',
              onPress: () => Linking.openURL(data.downloadUrl),
            },
          ],
          { cancelable: false }
        );
        return;
      }

      // 建议更新
      if (data.needsUpdate) {
        Alert.alert(
          '版本更新',
          `发现新版本 ${data.latest}，建议更新以获得更好体验。\n\n${data.updateNote}`,
          [
            { text: '稍后', style: 'cancel' },
            { text: '立即更新', onPress: () => Linking.openURL(data.downloadUrl) },
          ]
        );
      }

      // 显示公告
      if (data.announcement) {
        Alert.alert('系统公告', data.announcement);
      }
    } catch (error) {
      console.error('检查更新失败:', error);
    }
  };

  // 手动检查更新
  const manualCheck = async () => {
    try {
      const currentVersion = Application.nativeApplicationVersion || '1.0.0';
      const response = await fetch(`${API_BASE_URL}/version/check?version=${currentVersion}`);
      const data = await response.json();

      if (!data.needsUpdate && !data.forceUpdate) {
        Alert.alert('版本检查', '当前已是最新版本');
      } else {
        checkUpdate();
      }
    } catch (error) {
      Alert.alert('错误', '检查更新失败');
    }
  };

  return React.cloneElement(children, { manualCheck });
}
