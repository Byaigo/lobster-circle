/**
 * 网络状态指示器组件
 * 
 * 功能：
 * - 显示当前网络状态
 * - 网络变化时提示
 * - 离线模式自动提示
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { addNetworkListener, NetworkState, getQueueStatus } from '../services/offlineService';

export default function NetworkStatus() {
  const [networkState, setNetworkState] = useState(NetworkState.UNKNOWN);
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  
  // 动画
  const slideAnim = new Animated.Value(-100);

  useEffect(() => {
    // 监听网络状态变化
    const unsubscribe = addNetworkListener(handleNetworkChange);
    
    // 初始检查
    checkQueueStatus();
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // 根据网络状态显示/隐藏提示
    if (networkState === NetworkState.OFFLINE) {
      showBanner();
    } else if (networkState === NetworkState.ONLINE && isVisible) {
      // 网络恢复时显示成功提示
      showSuccessBanner();
    }
  }, [networkState]);

  const handleNetworkChange = (state) => {
    setNetworkState(state);
  };

  const checkQueueStatus = async () => {
    const status = await getQueueStatus();
    setPendingCount(status.pending);
  };

  const showBanner = () => {
    setIsVisible(true);
    checkQueueStatus();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // 3 秒后自动隐藏（如果是离线状态）
    if (networkState === NetworkState.OFFLINE) {
      setTimeout(() => {
        hideBanner();
      }, 3000);
    }
  };

  const showSuccessBanner = () => {
    setIsVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // 1.5 秒后自动隐藏
    setTimeout(() => {
      hideBanner();
    }, 1500);
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const getStatusConfig = () => {
    switch (networkState) {
      case NetworkState.ONLINE:
        return {
          bgColor: '#4CAF50',
          icon: '🟢',
          text: pendingCount > 0 
            ? `网络已恢复，${pendingCount} 项待同步...` 
            : '网络已连接',
        };
      case NetworkState.OFFLINE:
        return {
          bgColor: '#FF9800',
          icon: '📴',
          text: pendingCount > 0
            ? `离线模式，${pendingCount} 项待发送`
            : '离线模式',
        };
      default:
        return {
          bgColor: '#9E9E9E',
          icon: '❓',
          text: '检测网络中...',
        };
    }
  };

  const config = getStatusConfig();

  if (networkState === NetworkState.UNKNOWN) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bgColor },
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={() => {
          if (pendingCount > 0 && networkState === NetworkState.ONLINE) {
            // 点击触发同步
            import('../services/offlineService').then(({ flushOfflineQueue }) => {
              flushOfflineQueue();
            });
          }
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={styles.text}>{config.text}</Text>
        {pendingCount > 0 && networkState === NetworkState.ONLINE && (
          <Text style={styles.syncButton}>点击同步</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  syncButton: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
});
