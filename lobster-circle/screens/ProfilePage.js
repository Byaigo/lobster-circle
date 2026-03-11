/**
 * 🦞 个人主页 - 查看自己/他人的动态
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  SafeAreaView, Image, RefreshControl, Alert
} from 'react-native';
import { postAPI, userAPI, friendAPI } from '../api';

export default function ProfilePage({ route, currentUser, darkMode, navigation }) {
  const { userId } = route.params || {};
  const isMe = !userId || userId === currentUser.id;
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const targetId = userId || currentUser.id;
      
      // 获取用户信息
      if (!isMe) {
        const userData = await userAPI.getUser(targetId);
        setProfileUser(userData.user);
      } else {
        setProfileUser(currentUser);
      }

      // 获取动态
      const postsData = isMe 
        ? await postAPI.getFavorites() // 自己的页面显示收藏
        : await postAPI.getByHashtag('user_' + targetId);
      
      setPosts(postsData.posts || []);
    } catch (error) {
      console.error('加载失败:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile().finally(() => setRefreshing(false));
  };

  const handleFollow = async () => {
    try {
      await userAPI.follow(userId);
      Alert.alert('成功', isFollowing ? '已取消关注' : '已关注');
      loadProfile();
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  const handleAddFriend = async () => {
    try {
      await friendAPI.sendRequest(userId, '想和你做朋友');
      Alert.alert('成功', '好友请求已发送');
    } catch (error) {
      Alert.alert('错误', error.message || '发送失败');
    }
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity 
      style={[styles.postCard, darkMode && styles.postCardDark]}
      onPress={() => Alert.alert('动态详情', '查看动态详情功能开发中...')}
    >
      {item.images && item.images.length > 0 ? (
        <Image source={{ uri: item.images[0].url }} style={styles.postImage} />
      ) : (
        <View style={styles.postContentContainer}>
          <Text style={[styles.postContent, darkMode && styles.textDark]} numberOfLines={3}>
            {item.content}
          </Text>
        </View>
      )}
      <View style={styles.postStats}>
        <Text style={styles.statText}>❤️ {item.likes?.length || 0}</Text>
        <Text style={styles.statText}>💬 {item.comments?.length || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!profileUser) {
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
        <Text style={styles.avatar}>{profileUser.avatar || '😎'}</Text>
        <Text style={[styles.username, darkMode && styles.textDark]}>{profileUser.username}</Text>
        <Text style={[styles.bio, darkMode && styles.textMuted]}>{profileUser.bio || '暂无简介'}</Text>
        
        {!isMe && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.followButton]}
              onPress={handleFollow}
            >
              <Text style={styles.actionButtonText}>关注</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.friendButton]}
              onPress={handleAddFriend}
            >
              <Text style={styles.actionButtonText}>加好友</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, darkMode && styles.textDark]}>{profileUser.followers || 0}</Text>
            <Text style={[styles.statLabel, darkMode && styles.textMuted]}>粉丝</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, darkMode && styles.textDark]}>{profileUser.following || 0}</Text>
            <Text style={[styles.statLabel, darkMode && styles.textMuted]}>关注</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, darkMode && styles.textDark]}>{posts.length}</Text>
            <Text style={[styles.statLabel, darkMode && styles.textMuted]}>动态</Text>
          </View>
        </View>
      </View>

      {/* 动态列表 */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.postsGrid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, darkMode && styles.textDark]}>还没有动态</Text>
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
  header: { backgroundColor: '#fff', padding: 20, alignItems: 'center' },
  headerDark: { backgroundColor: '#1a1a2e' },
  avatar: { fontSize: 80, marginBottom: 10 },
  username: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 5 },
  bio: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 15 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionButton: { paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20 },
  followButton: { backgroundColor: '#00ff88' },
  friendButton: { backgroundColor: '#e0e0e0' },
  actionButtonText: { color: '#1a1a2e', fontWeight: 'bold' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#00ff88' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 3 },
  postsGrid: { padding: 10 },
  postCard: { flex: 1, margin: 5, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  postCardDark: { backgroundColor: '#1a1a2e' },
  postImage: { width: '100%', aspectRatio: 1 },
  postContentContainer: { padding: 10, aspectRatio: 1 },
  postContent: { fontSize: 14, color: '#333' },
  postStats: { flexDirection: 'row', justifyContent: 'space-around', padding: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  statText: { fontSize: 12, color: '#666' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
  emptyText: { fontSize: 16, color: '#666' }
});
