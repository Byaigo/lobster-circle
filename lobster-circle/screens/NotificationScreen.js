/**
 * 通知中心页面
 * 整合所有通知类型
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationScreen({ darkMode, navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, like, comment, follow, system

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
      // 使用模拟数据
      setNotifications(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const now = new Date();
    return [
      {
        _id: '1',
        type: 'like',
        fromUser: { username: '小明', avatar: '👦' },
        post: { _id: 'post1', content: '我的动态' },
        createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
        read: false,
      },
      {
        _id: '2',
        type: 'comment',
        fromUser: { username: '小红', avatar: '👧' },
        post: { _id: 'post1', content: '我的动态' },
        comment: { text: '写得好！' },
        createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
        read: false,
      },
      {
        _id: '3',
        type: 'follow',
        fromUser: { username: '龙虾', avatar: '🦞' },
        createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
        read: true,
      },
      {
        _id: '4',
        type: 'system',
        title: '系统通知',
        content: '欢迎使用龙虾圈！',
        createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
      },
    ];
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(
        notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👥';
      case 'system': return '📢';
      default: return '🔔';
    }
  };

  const getNotificationText = (item) => {
    switch (item.type) {
      case 'like':
        return `${item.fromUser?.username} 赞了你的动态`;
      case 'comment':
        return `${item.fromUser?.username} 评论了你：${item.comment?.text}`;
      case 'follow':
        return `${item.fromUser?.username} 关注了你`;
      case 'system':
        return item.content;
      default:
        return '新通知';
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.read && styles.notificationRead, darkMode && styles.notificationItemDark]}
      onPress={() => markAsRead(item._id)}
      onLongPress={() => {
        // 长按删除
      }}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.text, darkMode && styles.textDark]} numberOfLines={2}>
          {getNotificationText(item)}
        </Text>
        <Text style={[styles.time, darkMode && styles.textMuted]}>
          {new Date(item.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderFilterButton = (value, label) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
        <Text style={[styles.loadingText, darkMode && styles.textDark]}>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* 头部 */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>🔔 通知中心</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllRead}>全部已读</Text>
        </TouchableOpacity>
      </View>

      {/* 筛选器 */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', '全部')}
        {renderFilterButton('like', '点赞')}
        {renderFilterButton('comment', '评论')}
        {renderFilterButton('follow', '关注')}
        {renderFilterButton('system', '系统')}
      </View>

      {/* 通知列表 */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00ff88']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔕</Text>
            <Text style={[styles.emptyText, darkMode && styles.textDark]}>暂无通知</Text>
            <Text style={[styles.emptySubtext, darkMode && styles.textMuted]}>有更新时会在这里显示</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { flex: 1, backgroundColor: '#0f0f1a' },
  textDark: { color: '#fff' },
  textMuted: { color: '#888' },
  loadingText: { fontSize: 16, textAlign: 'center', marginTop: 50 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerDark: { backgroundColor: '#1a1a2e', borderBottomColor: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  markAllRead: { color: '#00ff88', fontWeight: 'bold' },
  
  filterContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#f0f0f0' },
  filterButtonActive: { backgroundColor: '#00ff88' },
  filterText: { color: '#666', fontSize: 14 },
  filterTextActive: { color: '#1a1a2e', fontWeight: 'bold' },
  
  list: { padding: 10 },
  notificationItem: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  notificationItemDark: { backgroundColor: '#1a1a2e' },
  notificationRead: { opacity: 0.6 },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  icon: { fontSize: 24 },
  content: { flex: 1 },
  text: { fontSize: 15, color: '#333', marginBottom: 5 },
  time: { fontSize: 12, color: '#999' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff4444' },
  
  emptyState: { alignItems: 'center', padding: 50 },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: '#999' },
});
