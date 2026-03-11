/**
 * 通知角标组件
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationBadge({ onPress }) {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // 每 5 秒刷新一次未读数
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      const list = stored ? JSON.parse(stored) : [];
      const unreadCount = list.filter(n => !n.read).length;
      setCount(unreadCount);
      setNotifications(list);
    } catch (error) {
      console.error('加载通知失败:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      const list = stored ? JSON.parse(stored) : [];
      const updated = list.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
      loadNotifications();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      const list = stored ? JSON.parse(stored) : [];
      const updated = list.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
      loadNotifications();
    } catch (error) {
      console.error('全部标记失败:', error);
    }
  };

  const clearAll = async () => {
    try {
      await AsyncStorage.removeItem('notifications');
      setCount(0);
      setNotifications([]);
    } catch (error) {
      console.error('清空失败:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      like: '❤️',
      comment: '💬',
      follow: '👤',
      friend_request: '🤝',
      system: '📢'
    };
    return icons[type] || '🔔';
  };

  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.read && styles.notificationRead]}
      onPress={() => markAsRead(item.id)}
    >
      <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{getTimeAgo(item.receivedAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity style={styles.badgeContainer} onPress={() => setModalVisible(true)}>
        <Text style={styles.badgeIcon}>🔔</Text>
        {count > 0 && (
          <View style={[styles.badge, count > 99 && styles.badgeLarge]}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>通知</Text>
          <View style={styles.modalActions}>
            {count > 0 && (
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={styles.modalAction}>全部已读</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalAction}>关闭</Text>
            </TouchableOpacity>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={clearAll}>
                <Text style={[styles.modalAction, styles.clearAll]}>清空</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>暂无通知</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'relative',
    padding: 10
  },
  badgeIcon: {
    fontSize: 24
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5
  },
  badgeLarge: {
    paddingHorizontal: 7
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15
  },
  modalAction: {
    color: '#00ff88',
    fontSize: 14
  },
  clearAll: {
    color: '#ff4444'
  },
  list: {
    padding: 10
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center'
  },
  notificationRead: {
    opacity: 0.6
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 15
  },
  notificationContent: {
    flex: 1
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 5
  },
  notificationTime: {
    fontSize: 12,
    color: '#999'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10
  },
  emptyText: {
    fontSize: 16,
    color: '#999'
  }
});
