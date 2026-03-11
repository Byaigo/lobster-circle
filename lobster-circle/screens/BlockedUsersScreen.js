/**
 * 黑名单管理页面
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  SafeAreaView, Alert
} from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BlockedUsersScreen({ darkMode }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setBlockedUsers(data.blockedUsers || []);
    } catch (error) {
      console.error('加载黑名单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    Alert.alert('解除拉黑', '确定要解除拉黑该用户吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`${API_BASE_URL}/users/${userId}/block`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            loadBlockedUsers();
            Alert.alert('成功', '已解除拉黑');
          } catch (error) {
            Alert.alert('错误', '操作失败');
          }
        },
      },
    ]);
  };

  const renderUser = ({ item }) => (
    <View style={[styles.userCard, darkMode && styles.userCardDark]}>
      <Text style={styles.avatar}>{item.avatar || '😎'}</Text>
      <View style={styles.userInfo}>
        <Text style={[styles.username, darkMode && styles.textDark]}>{item.username}</Text>
        <Text style={[styles.bio, darkMode && styles.textMuted]} numberOfLines={1}>
          {item.bio || '暂无简介'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item._id)}
      >
        <Text style={styles.unblockButtonText}>解除</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.textDark]}>🚫 黑名单管理</Text>
        <Text style={[styles.subtitle, darkMode && styles.textMuted]}>
          已拉黑 {blockedUsers.length} 个用户
        </Text>
      </View>

      {blockedUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, darkMode && styles.textDark]}>暂无拉黑用户</Text>
          <Text style={[styles.emptySubtext, darkMode && styles.textMuted]}>
            拉黑的用户将出现在这里
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderUser}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
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
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerDark: { backgroundColor: '#1a1a2e', borderBottomColor: '#333' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 14 },
  list: { padding: 15 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  userCardDark: { backgroundColor: '#1a1a2e' },
  avatar: { fontSize: 40, marginRight: 15 },
  userInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  bio: { fontSize: 13 },
  unblockButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#ff4444',
    borderRadius: 20,
  },
  unblockButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptySubtext: { fontSize: 14 },
});
