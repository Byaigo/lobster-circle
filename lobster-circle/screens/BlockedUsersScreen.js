/**
 * 黑名单管理页面
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Alert, RefreshControl } from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BlockedUsersScreen({ darkMode, navigation }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/blocked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.blockedUsers) {
        setBlockedUsers(data.blockedUsers);
      }
    } catch (error) {
      console.error('加载黑名单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId, username) => {
    Alert.alert(
      '解除拉黑',
      `确定要解除拉黑 "${username}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`${API_BASE_URL}/users/${userId}/unblock`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              await loadBlockedUsers();
              Alert.alert('成功', '已解除拉黑');
            } catch (error) {
              Alert.alert('错误', '操作失败');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlockedUsers();
    setRefreshing(false);
  };

  const renderUser = ({ item }) => (
    <View style={[styles.userItem, darkMode && styles.userItemDark]}>
      <View style={styles.userInfo}>
        <Text style={styles.userAvatar}>{item.avatar || '😎'}</Text>
        <View style={styles.userDetails}>
          <Text style={[styles.username, darkMode && styles.textDark]}>{item.username}</Text>
          <Text style={[styles.blockedTime, darkMode && styles.textMuted]}>
            拉黑时间：{new Date(item.blockedAt).toLocaleString('zh-CN')}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => unblockUser(item._id, item.username)}
      >
        <Text style={styles.unblockButtonText}>解除</Text>
      </TouchableOpacity>
    </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>🚫 黑名单管理</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 说明 */}
      <View style={[styles.infoCard, darkMode && styles.infoCardDark]}>
        <Text style={[styles.infoText, darkMode && styles.textMuted]}>
          拉黑的用户将无法查看你的动态、给你发消息或评论你的动态。
        </Text>
      </View>

      {/* 列表 */}
      {blockedUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={[styles.emptyText, darkMode && styles.textDark]}>暂无拉黑用户</Text>
          <Text style={[styles.emptySubtext, darkMode && styles.textMuted]}>
            遇到骚扰用户可以在其主页点击拉黑
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderUser}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00ff88']} />
          }
        />
      )}
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
  backButton: { fontSize: 24, color: '#00ff88', paddingHorizontal: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  
  infoCard: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10 },
  infoCardDark: { backgroundColor: '#1a1a2e' },
  infoText: { fontSize: 14, lineHeight: 20 },
  
  list: { padding: 15 },
  userItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10 },
  userItemDark: { backgroundColor: '#1a1a2e' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userAvatar: { fontSize: 40, marginRight: 15 },
  userDetails: { flex: 1 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 3 },
  blockedTime: { fontSize: 12, color: '#999' },
  unblockButton: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#ff4444', borderRadius: 20 },
  unblockButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  emptyState: { alignItems: 'center', padding: 50 },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center' },
});
