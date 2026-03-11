/**
 * 🦞 好友页面
 * 功能：好友列表、好友请求、添加好友
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, 
  SafeAreaView, Alert, Modal, RefreshControl
} from 'react-native';
import { friendAPI, userAPI } from '../api';

export default function FriendsScreen({ currentUser, darkMode, navigation }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'add'
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendAPI.getList(),
        friendAPI.getReceivedRequests()
      ]);
      setFriends(friendsData.friends || []);
      setRequests(requestsData.requests || []);
    } catch (error) {
      console.error('加载数据失败:', error);
      Alert.alert('错误', '加载数据失败，请检查网络连接');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const data = await userAPI.search(searchQuery);
      setSearchResults(data.users || []);
      setActiveTab('add');
    } catch (error) {
      Alert.alert('错误', '搜索失败');
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      await friendAPI.sendRequest(receiverId, addMessage);
      Alert.alert('成功', '好友请求已发送');
      setAddModalVisible(false);
      setAddMessage('');
    } catch (error) {
      Alert.alert('错误', error.message || '发送请求失败');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await friendAPI.acceptRequest(requestId);
      Alert.alert('成功', '已同意好友请求');
      loadData();
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await friendAPI.rejectRequest(requestId);
      Alert.alert('成功', '已拒绝好友请求');
      loadData();
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  const deleteFriend = async (friendId) => {
    Alert.alert(
      '删除好友',
      '确定要删除该好友吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: async () => {
            try {
              await friendAPI.delete(friendId);
              Alert.alert('成功', '已删除好友');
              loadData();
            } catch (error) {
              Alert.alert('错误', '删除失败');
            }
          }
        }
      ]
    );
  };

  const startChat = (friend) => {
    navigation.navigate('Chat', { 
      userId: friend._id || friend.id,
      username: friend.username,
      avatar: friend.avatar 
    });
  };

  const renderFriend = ({ item }) => (
    <View style={[styles.friendCard, darkMode && styles.friendCardDark]}>
      <Text style={styles.friendAvatar}>{item.avatar || '😎'}</Text>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, darkMode && styles.textDark]}>{item.username}</Text>
        <Text style={[styles.friendBio, darkMode && styles.textMuted]}>{item.bio || '暂无简介'}</Text>
        <Text style={styles.friendStatus}>{item.isOnline ? '🟢 在线' : '⚫ 离线'}</Text>
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity style={styles.chatButton} onPress={() => startChat(item)}>
          <Text style={styles.chatButtonText}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteFriend(item._id || item.id)}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequest = ({ item }) => (
    <View style={[styles.requestCard, darkMode && styles.requestCardDark]}>
      <Text style={styles.requestAvatar}>{item.sender?.avatar || '😎'}</Text>
      <View style={styles.requestInfo}>
        <Text style={[styles.requestName, darkMode && styles.textDark]}>{item.sender?.username}</Text>
        <Text style={[styles.requestMessage, darkMode && styles.textMuted]}>{item.message || '想和你做朋友'}</Text>
        <Text style={styles.requestTime}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => acceptRequest(item._id)}>
          <Text style={styles.acceptButtonText}>✓ 同意</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => rejectRequest(item._id)}>
          <Text style={styles.rejectButtonText}>✕ 拒绝</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }) => (
    <View style={[styles.userCard, darkMode && styles.userCardDark]}>
      <Text style={styles.userAvatar}>{item.avatar || '😎'}</Text>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, darkMode && styles.textDark]}>{item.username}</Text>
        <Text style={[styles.userBio, darkMode && styles.textMuted]}>{item.bio || '暂无简介'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          setAddMessage('');
          Alert.alert(
            '发送好友请求',
            '添加留言（可选）',
            [
              { text: '取消', style: 'cancel' },
              { 
                text: '发送',
                onPress: () => sendFriendRequest(item._id)
              }
            ],
            {
              onDismiss: () => {
                // 处理留言输入
              }
            }
          );
        }}
      >
        <Text style={styles.addButtonText}>＋ 加好友</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>👥 好友</Text>
      </View>

      {/* 标签切换 */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            好友 ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            请求 ({requests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'add' && styles.activeTab]}
          onPress={() => setActiveTab('add')}
        >
          <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
            添加
          </Text>
        </TouchableOpacity>
      </View>

      {/* 搜索框（添加页面显示） */}
      {activeTab === 'add' && (
        <View style={styles.searchBar}>
          <TextInput
            style={[styles.searchInput, darkMode && styles.inputDark]}
            placeholder="搜索用户名..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
          />
          <TouchableOpacity style={styles.searchButton} onPress={searchUsers}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 内容列表 */}
      <FlatList
        data={
          activeTab === 'friends' ? friends :
          activeTab === 'requests' ? requests :
          searchResults
        }
        renderItem={
          activeTab === 'friends' ? renderFriend :
          activeTab === 'requests' ? renderRequest :
          renderSearchResult
        }
        keyExtractor={item => item._id || item.id || Math.random().toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, darkMode && styles.textDark]}>
              {activeTab === 'friends' ? '还没有好友' :
               activeTab === 'requests' ? '没有好友请求' :
               '搜索用户添加好友'}
            </Text>
            <Text style={[styles.emptySubtext, darkMode && styles.textMuted]}>
              {activeTab === 'friends' ? '去添加好友吧～' :
               activeTab === 'requests' ? '有新请求会显示在这里' :
               '输入用户名搜索'}
            </Text>
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
  header: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerDark: { backgroundColor: '#1a1a2e', borderBottomColor: '#333' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, padding: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#00ff88' },
  tabText: { fontSize: 15, color: '#666' },
  activeTabText: { color: '#00ff88', fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', gap: 10 },
  searchInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, padding: 10, fontSize: 14 },
  inputDark: { backgroundColor: '#1a1a2e', color: '#fff' },
  searchButton: { backgroundColor: '#00ff88', width: 44, height: 44, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchButtonText: { fontSize: 18 },
  list: { padding: 10 },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  friendCardDark: { backgroundColor: '#1a1a2e' },
  friendAvatar: { fontSize: 40, marginRight: 15 },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  friendBio: { fontSize: 13, color: '#666', marginTop: 3 },
  friendStatus: { fontSize: 12, color: '#999', marginTop: 3 },
  friendActions: { flexDirection: 'row', gap: 10 },
  chatButton: { backgroundColor: '#00ff88', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chatButtonText: { fontSize: 18 },
  deleteButton: { backgroundColor: '#ff4444', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { fontSize: 18 },
  requestCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  requestCardDark: { backgroundColor: '#1a1a2e' },
  requestAvatar: { fontSize: 40, marginBottom: 10 },
  requestInfo: { marginBottom: 10 },
  requestName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  requestMessage: { fontSize: 14, color: '#666', marginTop: 3 },
  requestTime: { fontSize: 12, color: '#999', marginTop: 3 },
  requestActions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  acceptButton: { backgroundColor: '#00ff88' },
  acceptButtonText: { color: '#1a1a2e', fontWeight: 'bold' },
  rejectButton: { backgroundColor: '#eee' },
  rejectButtonText: { color: '#666', fontWeight: 'bold' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  userCardDark: { backgroundColor: '#1a1a2e' },
  userAvatar: { fontSize: 40, marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  userBio: { fontSize: 13, color: '#666', marginTop: 3 },
  addButton: { backgroundColor: '#00ff88', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  addButtonText: { color: '#1a1a2e', fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 50 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#999' }
});
