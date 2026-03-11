/**
 * 设置页面 - 隐私设置、黑名单管理
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Switch, FlatList, Alert } from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ currentUser, darkMode, setDarkMode }) {
  const [settings, setSettings] = useState({
    allowPost: true,
    allowComment: true,
    allowMessage: true,
  });
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    loadSettings();
    loadBlockedUsers();
  }, []);

  const loadSettings = async () => {
    // 加载个人设置
  };

  const loadBlockedUsers = async () => {
    // 加载黑名单用户
  };

  const handleBlockUser = async (userId) => {
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

  const renderBlockedUser = ({ item }) => (
    <View style={[styles.blockedUser, darkMode && styles.blockedUserDark]}>
      <Text style={styles.blockedUserAvatar}>{item.avatar || '😎'}</Text>
      <View style={styles.blockedUserInfo}>
        <Text style={[styles.blockedUserName, darkMode && styles.textDark]}>{item.username}</Text>
        <Text style={[styles.blockedUserTime, darkMode && styles.textMuted]}>拉黑时间：{new Date(item.blockedAt).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity style={styles.unblockButton} onPress={() => handleBlockUser(item._id)}>
        <Text style={styles.unblockButtonText}>解除</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.textDark]}>⚙️ 设置</Text>
      </View>

      {/* 隐私设置 */}
      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>🔒 隐私设置</Text>
        
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, darkMode && styles.textDark]}>允许他人给我发帖</Text>
          <Switch
            value={settings.allowPost}
            onValueChange={(value) => setSettings({ ...settings, allowPost: value })}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, darkMode && styles.textDark]}>允许他人评论我</Text>
          <Switch
            value={settings.allowComment}
            onValueChange={(value) => setSettings({ ...settings, allowComment: value })}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, darkMode && styles.textDark]}>允许他人私信我</Text>
          <Switch
            value={settings.allowMessage}
            onValueChange={(value) => setSettings({ ...settings, allowMessage: value })}
          />
        </View>
      </View>

      {/* 黑名单管理 */}
      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>🚫 黑名单管理</Text>
        {blockedUsers.length === 0 ? (
          <Text style={[styles.emptyText, darkMode && styles.textMuted]}>暂无拉黑用户</Text>
        ) : (
          <FlatList
            data={blockedUsers}
            renderItem={renderBlockedUser}
            keyExtractor={item => item._id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* 外观设置 */}
      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>🎨 外观设置</Text>
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, darkMode && styles.textDark]}>深色模式</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>

      {/* 关于 */}
      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>ℹ️ 关于</Text>
        <View style={styles.aboutItem}>
          <Text style={[styles.aboutLabel, darkMode && styles.textDark]}>版本号</Text>
          <Text style={[styles.aboutValue, darkMode && styles.textMuted]}>3.1.0</Text>
        </View>
        <TouchableOpacity style={styles.aboutItem}>
          <Text style={[styles.aboutLabel, darkMode && styles.textDark]}>用户协议</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aboutItem}>
          <Text style={[styles.aboutLabel, darkMode && styles.textDark]}>隐私政策</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>
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
  title: { fontSize: 24, fontWeight: 'bold' },
  section: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10 },
  sectionDark: { backgroundColor: '#1a1a2e' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  settingLabel: { fontSize: 15 },
  blockedUser: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  blockedUserDark: { borderBottomColor: '#333' },
  blockedUserAvatar: { fontSize: 32, marginRight: 10 },
  blockedUserInfo: { flex: 1 },
  blockedUserName: { fontSize: 15, fontWeight: 'bold' },
  blockedUserTime: { fontSize: 12, color: '#999', marginTop: 3 },
  unblockButton: { paddingHorizontal: 15, paddingVertical: 5, backgroundColor: '#ff4444', borderRadius: 15 },
  unblockButtonText: { color: '#fff', fontSize: 12 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', padding: 20 },
  aboutItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  aboutLabel: { fontSize: 15 },
  aboutValue: { fontSize: 15 },
  arrow: { fontSize: 20, color: '#ccc' },
});
