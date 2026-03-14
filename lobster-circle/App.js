/**
 * 🦞 龙虾圈 - Lobster Circle
 * 完整的社交 App（前端 + 后端集成版）
 * 
 * 功能：信息流、发布动态、点赞评论收藏、好友系统、私信聊天、通知中心、搜索、深色模式
 */

import React, { useState, useEffect, createContext } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, 
  Image, SafeAreaView, StatusBar, Alert, Modal, RefreshControl, Switch,
  ActivityIndicator
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect } from 'react';

// 导入 API 和 Socket
import api, { authAPI, postAPI, friendAPI, messageAPI, uploadAPI } from './api';
import socketService from './socket';
import { initNetworkListener, flushOfflineQueue, offlineCreatePost, isOnline } from './services/offlineService';

// 导入页面
import FriendsScreen from './screens/FriendsScreen';
import ChatScreen from './screens/ChatScreen';
import AboutScreen from './screens/AboutScreen';
import CheckInHistoryScreen from './screens/CheckInHistoryScreen';
import NetworkStatus from './components/NetworkStatus';

// 新增社交功能页面
import NearbyScreen from './screens/NearbyScreen';
import GroupsScreen from './screens/GroupsScreen';
import VisitorsScreen from './screens/VisitorsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ==================== 模拟数据（离线模式） ====================
const initialUsers = {
  'user1': { id: 'user1', username: '龙虾', avatar: '🦞', bio: '龙虾圈创始人', followers: 128, following: 45 },
  'user2': { id: 'user2', username: '小明', avatar: '👦', bio: '热爱生活', followers: 56, following: 89 },
  'user3': { id: 'user3', username: '小红', avatar: '👧', bio: '天天开心', followers: 234, following: 123 },
};

const initialPosts = [
  {
    id: '1',
    userId: 'user1',
    content: '欢迎来到龙虾圈！这是第一条动态～ #欢迎 #新朋友',
    image: null,
    likes: ['user2', 'user3'],
    comments: [{ id: 'c1', userId: 'user2', text: '沙发！🎉', timestamp: '5 分钟前' }],
    timestamp: '10 分钟前',
    isFavorite: false,
    visibility: 'public'
  },
  {
    id: '2',
    userId: 'user2',
    content: '今天天气真好，出去玩了！#好心情 #周末',
    image: null,
    likes: ['user1'],
    comments: [],
    timestamp: '30 分钟前',
    isFavorite: false,
    visibility: 'public'
  },
];

const initialNotifications = [
  { id: 'n1', type: 'like', userId: 'user2', postId: '1', timestamp: '5 分钟前', read: false },
  { id: 'n2', type: 'comment', userId: 'user3', postId: '1', text: '写得真好！', timestamp: '10 分钟前', read: false },
];

// ==================== 登录/注册页面 ====================
function AuthScreen({ onLogin, darkMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('提示', '请填写用户名和密码');
      return;
    }

    setLoading(true);
    try {
      // 尝试连接后端 API
      const data = isLogin 
        ? await authAPI.login(username, password)
        : await authAPI.register(username, password);
      
      onLogin(data.user, data.token);
    } catch (error) {
      // 后端不可用，使用本地模式
      console.log('后端不可用，使用本地模式');
      const user = {
        id: 'current',
        username: username,
        avatar: '😎',
        bio: '龙虾圈用户',
        followers: 0,
        following: 0
      };
      await AsyncStorage.setItem('token', 'local-token');
      onLogin(user, 'local-token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.authContainer, darkMode && styles.authContainerDark]}>
      <View style={styles.authContent}>
        <Text style={[styles.authTitle, darkMode && styles.textDark]}>🦞 龙虾圈</Text>
        <Text style={[styles.authSubtitle, darkMode && styles.textMuted]}>{isLogin ? '欢迎回来' : '创建账号'}</Text>
        
        <TextInput 
          style={[styles.authInput, darkMode && styles.inputDark]} 
          placeholder="用户名" 
          placeholderTextColor="#999" 
          value={username} 
          onChangeText={setUsername} 
        />
        <TextInput 
          style={[styles.authInput, darkMode && styles.inputDark]} 
          placeholder="密码" 
          placeholderTextColor="#999" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />
        
        <TouchableOpacity 
          style={[styles.authButton, loading && styles.authButtonDisabled]} 
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1a1a2e" />
          ) : (
            <Text style={styles.authButtonText}>{isLogin ? '登录' : '注册'}</Text>
          )}
        </TouchableOpacity>
        
        {/* 发布按钮加载状态 */}
        {loading && (
          <View style={styles.publishLoadingOverlay}>
            <ActivityIndicator size="large" color="#00ff88" />
            <Text style={styles.publishLoadingText}>发布中...</Text>
          </View>
        )}
        
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.authSwitch}>{isLogin ? '没有账号？去注册' : '已有账号？去登录'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==================== 首页 - 信息流 ====================
function HomeScreen({ currentUser, users, posts, setPosts, favorites, setFavorites, darkMode, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  // 初始化网络监听
  useEffect(() => {
    const cleanup = initNetworkListener();
    
    // 网络恢复时刷新离线队列
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const publishPost = async () => {
    if (!newPost.trim() && !selectedImage) {
      Alert.alert('提示', '写点什么或选择图片吧～');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      
      // 如果有图片，先上传到七牛云
      if (selectedImage) {
        try {
          const uploadResult = await uploadAPI.uploadImage(selectedImage);
          imageUrl = uploadResult.url;
          console.log('图片上传成功:', imageUrl);
        } catch (uploadError) {
          console.log('图片上传失败，使用本地模式:', uploadError);
          imageUrl = selectedImage; // 降级使用本地图片
        }
      }

      // 发布动态
      const post = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: newPost,
        image: imageUrl,
        likes: [],
        comments: [],
        timestamp: '刚刚',
        isFavorite: false,
        visibility
      };

      const online = await isOnline();
      
      if (online) {
        try {
          await postAPI.create(newPost, imageUrl ? [{ url: imageUrl }] : [], visibility);
        } catch (error) {
          console.log('后端不可用，使用离线模式');
        }
      } else {
        // 离线模式：添加到队列
        await offlineCreatePost(newPost, imageUrl ? [{ url: imageUrl }] : []);
      }

      setPosts([post, ...posts]);
      setNewPost('');
      setSelectedImage(null);
      setModalVisible(false);
      
      if (online) {
        Alert.alert('发布成功', '你的动态已发布！');
      } else {
        Alert.alert('已保存到草稿箱', '网络不可用，动态将在网络恢复时自动发送');
      }
    } catch (error) {
      Alert.alert('发布失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const isLiked = post.likes.includes(currentUser.id);
        return { ...post, likes: isLiked ? post.likes.filter(id => id !== currentUser.id) : [...post.likes, currentUser.id] };
      }
      return post;
    }));

    try {
      await postAPI.like(postId);
    } catch (error) {}
  };

  const toggleFavorite = async (postId) => {
    setFavorites(favorites.includes(postId) ? favorites.filter(id => id !== postId) : [...favorites, postId]);
    setPosts(posts.map(post => post.id === postId ? { ...post, isFavorite: !post.isFavorite } : post));
    
    try {
      await postAPI.favorite(postId);
    } catch (error) {}
  };

  const addComment = async () => {
    if (!commentText.trim()) { Alert.alert('提示', '写点评论吧～'); return; }
    
    setPosts(posts.map(post => {
      if (post.id === currentPostId) {
        return { ...post, comments: [...post.comments, { id: Date.now().toString(), userId: currentUser.id, text: commentText, timestamp: '刚刚' }] };
      }
      return post;
    }));

    try {
      await postAPI.comment(currentPostId, commentText);
    } catch (error) {}

    setCommentText('');
    setCommentModalVisible(false);
  };

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };
  const getUser = (userId) => users[userId] || { username: '未知用户', avatar: '❓' };
  const extractHashtags = (content) => content.match(/#\w+/g) || [];

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    return post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           getUser(post.userId).username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderPost = ({ item }) => {
    const user = getUser(item.userId);
    const isLiked = item.likes.includes(currentUser.id);
    const isFavorited = favorites.includes(item.id);
    const hashtags = extractHashtags(item.content);

    return (
      <View style={[styles.post, darkMode && styles.postDark]}>
        <View style={styles.postHeader}>
          <Text style={styles.avatar}>{user.avatar}</Text>
          <View>
            <Text style={[styles.userName, darkMode && styles.textDark]}>{user.username}</Text>
            <Text style={styles.timestamp}>{item.timestamp} · {item.visibility === 'public' ? '🌍' : item.visibility === 'friends' ? '👥' : '🔒'}</Text>
          </View>
        </View>
        <Text style={[styles.postContent, darkMode && styles.textDark]}>{item.content}</Text>
        {hashtags.length > 0 && (
          <View style={styles.hashtagContainer}>
            {hashtags.map((tag, i) => <Text key={i} style={styles.hashtag}>{tag}</Text>)}
          </View>
        )}
        {item.image && <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => likePost(item.id)}>
            <Text style={[styles.actionText, isLiked && styles.liked]}>{isLiked ? '❤️' : '🤍'} {item.likes.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => { setCurrentPostId(item.id); setCommentModalVisible(true); }}>
            <Text style={styles.actionText}>💬 {item.comments.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleFavorite(item.id)}>
            <Text style={[styles.actionText, isFavorited && styles.favorited]}>{isFavorited ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        </View>
        {item.comments.length > 0 && (
          <View style={styles.commentsPreview}>
            {item.comments.slice(0, 2).map(comment => {
              const commentUser = getUser(comment.userId);
              return (<Text key={comment.id} style={[styles.commentText, darkMode && styles.textDark]}><Text style={styles.commentUser}>{commentUser.username}</Text> {comment.text}</Text>);
            })}
            {item.comments.length > 2 && (<TouchableOpacity onPress={() => { setCurrentPostId(item.id); setCommentModalVisible(true); }}><Text style={styles.viewAllComments}>查看全部 {item.comments.length} 条</Text></TouchableOpacity>)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>🦞 龙虾圈</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowSearch(!showSearch)}>
            <Text style={styles.iconButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.iconButtonText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showSearch && (
        <View style={styles.searchBar}>
          <TextInput 
            style={[styles.searchInput, darkMode && styles.inputDark]} 
            placeholder="搜索动态或用户..." 
            placeholderTextColor="#999" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>
      )}
      <FlatList 
        data={filteredPosts} 
        renderItem={renderPost} 
        keyExtractor={item => item.id} 
        contentContainerStyle={styles.list} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00ff88']} />} 
      />
      
      {/* 发布 Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textDark]}>发布动态</Text>
            <TextInput 
              style={[styles.input, darkMode && styles.inputDark]} 
              placeholder="分享你的想法..." 
              placeholderTextColor="#999" 
              multiline 
              value={newPost} 
              onChangeText={setNewPost} 
            />
            {selectedImage && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImage} onPress={() => setSelectedImage(null)}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.selectImageButton} onPress={pickImage}>
              <Text style={styles.selectImageButtonText}>📷 选择图片</Text>
            </TouchableOpacity>
            <View style={styles.visibilitySelector}>
              <Text style={[styles.visibilityLabel, darkMode && styles.textDark]}>可见范围:</Text>
              <TouchableOpacity 
                style={[styles.visibilityOption, visibility === 'public' && styles.visibilitySelected]} 
                onPress={() => setVisibility('public')}
              >
                <Text>🌍 公开</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.visibilityOption, visibility === 'friends' && styles.visibilitySelected]} 
                onPress={() => setVisibility('friends')}
              >
                <Text>👥 好友</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.visibilityOption, visibility === 'private' && styles.visibilitySelected]} 
                onPress={() => setVisibility('private')}
              >
                <Text>🔒 私密</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.publishButton2]} onPress={publishPost}>
                <Text style={styles.publishButton2Text}>发布</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 评论 Modal */}
      <Modal animationType="slide" transparent={true} visible={commentModalVisible} onRequestClose={() => setCommentModalVisible(false)}>
        <View style={styles.commentModalContainer}>
          <View style={[styles.commentModalContent, darkMode && styles.modalContentDark]}>
            <Text style={[styles.commentModalTitle, darkMode && styles.textDark]}>评论</Text>
            <FlatList 
              data={posts.find(p => p.id === currentPostId)?.comments || []} 
              keyExtractor={item => item.id} 
              renderItem={({ item }) => { 
                const cu = getUser(item.userId); 
                return (
                  <View style={styles.commentItem}>
                    <Text style={styles.commentAvatar}>{cu.avatar}</Text>
                    <View style={styles.commentBody}>
                      <Text style={[styles.commentUsername, darkMode && styles.textDark]}>{cu.username}</Text>
                      <Text style={[styles.commentTextFull, darkMode && styles.textDark]}>{item.text}</Text>
                      <Text style={styles.commentTime}>{item.timestamp}</Text>
                    </View>
                  </View>
                ); 
              }} 
              style={styles.commentsList} 
            />
            <View style={styles.commentInputContainer}>
              <TextInput 
                style={[styles.commentInput, darkMode && styles.inputDark]} 
                placeholder="写下你的评论..." 
                placeholderTextColor="#999" 
                value={commentText} 
                onChangeText={setCommentText} 
              />
              <TouchableOpacity style={styles.sendComment} onPress={addComment}>
                <Text style={styles.sendCommentText}>发送</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==================== 通知页面 ====================
function NotificationsScreen({ notifications, setNotifications, users, darkMode }) {
  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const renderNotification = ({ item }) => {
    const user = users[item.userId] || { username: '未知用户', avatar: '❓' };
    const getTypeText = () => {
      if (item.type === 'like') return '赞了你的动态';
      if (item.type === 'comment') return `评论了你的动态：${item.text}`;
      if (item.type === 'follow') return '关注了你';
      return '';
    };

    return (
      <View style={[styles.notificationItem, item.read && styles.notificationRead, darkMode && styles.notificationItemDark]}>
        <Text style={styles.notificationAvatar}>{user.avatar}</Text>
        <View style={styles.notificationBody}>
          <Text style={[styles.notificationUser, darkMode && styles.textDark]}>{user.username}</Text>
          <Text style={[styles.notificationText, darkMode && styles.textDark]}>{getTypeText()}</Text>
          <Text style={styles.notificationTime}>{item.timestamp}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>🔔 通知</Text>
        <TouchableOpacity onPress={markAllRead}><Text style={styles.markReadBtn}>全部已读</Text></TouchableOpacity>
      </View>
      <FlatList 
        data={notifications} 
        renderItem={renderNotification} 
        keyExtractor={item => item.id} 
        contentContainerStyle={styles.list} 
      />
    </SafeAreaView>
  );
}

// ==================== 消息会话列表 ====================
function MessagesScreen({ currentUser, darkMode, navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messageAPI.getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.log('后端不可用，使用本地模式');
    } finally {
      setLoading(false);
    }
  };

  const startChat = (user) => {
    navigation.navigate('Chat', {
      userId: user.otherUser?._id || user.otherUser?.id,
      username: user.otherUser?.username,
      avatar: user.otherUser?.avatar
    });
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity style={[styles.conversationItem, darkMode && styles.conversationItemDark]} onPress={() => startChat(item)}>
      <Text style={styles.conversationAvatar}>{item.otherUser?.avatar || '😎'}</Text>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, darkMode && styles.textDark]}>{item.otherUser?.username}</Text>
          <Text style={styles.conversationTime}>{new Date(item.lastMessage?.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        </View>
        <Text style={[styles.conversationLastMessage, darkMode && styles.textMuted]} numberOfLines={1}>
          {item.lastMessage?.content || '暂无消息'}
        </Text>
      </View>
      {item.unreadCount > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{item.unreadCount}</Text></View>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>💬 消息</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#00ff88" /></View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, darkMode && styles.textDark]}>还没有消息</Text>
          <Text style={[styles.emptySubtext, darkMode && styles.textMuted]}>去好友列表找人聊天吧～</Text>
        </View>
      ) : (
        <FlatList data={conversations} renderItem={renderConversation} keyExtractor={item => item.conversationId} contentContainerStyle={styles.list} />
      )}
    </SafeAreaView>
  );
}

// ==================== 底部导航 ====================
function MainTabs({ currentUser, darkMode }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          if (route.name === 'Home') icon = '🏠';
          else if (route.name === 'Notifications') icon = '🔔';
          else if (route.name === 'Friends') icon = '👥';
          else if (route.name === 'Messages') icon = '💬';
          else if (route.name === 'Profile') icon = '👤';
          return <Text style={{ fontSize: size }}>{icon}</Text>;
        },
        tabBarActiveTintColor: '#00ff88',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} currentUser={currentUser} users={initialUsers} darkMode={darkMode} />}
      </Tab.Screen>
      <Tab.Screen name="Notifications">
        {props => <NotificationsScreen {...props} notifications={initialNotifications} users={initialUsers} darkMode={darkMode} />}
      </Tab.Screen>
      <Tab.Screen name="Friends">
        {props => <FriendsScreen {...props} currentUser={currentUser} darkMode={darkMode} navigation={props.navigation} />}
      </Tab.Screen>
      <Tab.Screen name="Messages">
        {props => <MessagesScreen {...props} currentUser={currentUser} darkMode={darkMode} navigation={props.navigation} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {props => <ProfileScreen {...props} currentUser={currentUser} darkMode={darkMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ==================== 个人主页 ====================
function ProfileScreen({ currentUser, setCurrentUser, darkMode, setDarkMode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(currentUser.bio);

  const saveBio = async () => {
    setCurrentUser({ ...currentUser, bio });
    setIsEditing(false);
    Alert.alert('保存成功');
  };

  const handleLogout = async () => {
    Alert.alert('登出', '确定要登出吗？', [
      { text: '取消', style: 'cancel' },
      { 
        text: '登出', 
        style: 'destructive',
        onPress: async () => {
          try {
            await authAPI.logout();
          } catch (error) {}
          await AsyncStorage.removeItem('token');
          socketService.disconnect();
          setCurrentUser(null);
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.profileHeader, darkMode && styles.profileHeaderDark]}>
        <Text style={styles.profileAvatar}>{currentUser.avatar}</Text>
        <Text style={[styles.profileName, darkMode && styles.textDark]}>{currentUser.username}</Text>
        {isEditing ? (
          <View style={styles.editBioContainer}>
            <TextInput 
              style={[styles.bioInput, darkMode && styles.inputDark]} 
              value={bio} 
              onChangeText={setBio} 
              placeholder="介绍一下自己" 
              placeholderTextColor="#999" 
            />
            <View style={styles.editButtons}>
              <TouchableOpacity onPress={() => setIsEditing(false)}><Text style={styles.cancelEdit}>取消</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveBio}><Text style={styles.saveEdit}>保存</Text></TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.profileBio, darkMode && styles.textMuted]}>{currentUser.bio}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}><Text style={styles.editBio}>✏️ 编辑简介</Text></TouchableOpacity>
          </>
        )}
      </View>
      
      <View style={[styles.stats, darkMode && styles.statsDark]}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{currentUser.followers}</Text>
          <Text style={[styles.statLabel, darkMode && styles.textMuted]}>粉丝</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{currentUser.following}</Text>
          <Text style={[styles.statLabel, darkMode && styles.textMuted]}>关注</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={[styles.statLabel, darkMode && styles.textMuted]}>动态</Text>
        </View>
      </View>

      <View style={[styles.profileMenu, darkMode && styles.profileMenuDark]}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setDarkMode(!darkMode)}>
          <Text style={styles.menuIcon}>🌙</Text>
          <Text style={[styles.menuText, darkMode && styles.textDark]}>深色模式</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuIcon}>⚙️</Text><Text style={[styles.menuText, darkMode && styles.textDark]}>设置</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}><Text style={styles.menuIcon}>🚪</Text><Text style={[styles.menuText, darkMode && styles.textDark]}>登出</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==================== 主应用 ====================
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState(initialPosts);
  const [favorites, setFavorites] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // 检查是否已登录
    checkAuth();
    
    return () => {
      socketService.disconnect();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const data = await authAPI.getMe();
        if (data.user) {
          setCurrentUser(data.user);
          socketService.connect(data.user.id);
        }
      }
    } catch (error) {
      console.log('未登录或后端不可用');
    }
  };

  const handleLogin = (user, token) => {
    setCurrentUser(user);
    socketService.connect(user.id);
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} darkMode={darkMode} />;
  }

  return (
    <NavigationContainer>
      {/* 网络状态指示器 */}
      <NetworkStatus />
      
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">
          {props => <MainTabs {...props} currentUser={currentUser} darkMode={darkMode} />}
        </Stack.Screen>
        <Stack.Screen name="Chat">
          {props => <ChatScreen {...props} currentUser={currentUser} darkMode={darkMode} />}
        </Stack.Screen>
        <Stack.Screen name="About">
          {props => <AboutScreen {...props} darkMode={darkMode} />}
        </Stack.Screen>
        <Stack.Screen name="CheckInHistory">
          {props => <CheckInHistoryScreen {...props} darkMode={darkMode} />}
        </Stack.Screen>
        
        {/* 新增社交功能页面 */}
        <Stack.Screen name="Nearby">
          {props => <NearbyScreen {...props} darkMode={darkMode} />}
        </Stack.Screen>
        <Stack.Screen name="Groups">
          {props => <GroupsScreen {...props} darkMode={darkMode} />}
        </Stack.Screen>
        <Stack.Screen name="Visitors">
          {props => <VisitorsScreen {...props} darkMode={darkMode} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==================== 样式 ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { flex: 1, backgroundColor: '#0f0f1a' },
  textDark: { color: '#fff' },
  textMuted: { color: '#888' },
  inputDark: { backgroundColor: '#1a1a2e', color: '#fff' },
  
  // 认证
  authContainer: { flex: 1, justifyContent: 'center' },
  authContainerDark: { backgroundColor: '#0f0f1a' },
  authContent: { margin: 30, alignItems: 'center' },
  authTitle: { fontSize: 48, marginBottom: 10, color: '#1a1a2e' },
  authSubtitle: { fontSize: 20, color: '#666', marginBottom: 40 },
  authInput: { width: '100%', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  authButton: { width: '100%', backgroundColor: '#00ff88', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  authButtonDisabled: { opacity: 0.6 },
  authButtonText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 18 },
  authSwitch: { color: '#00ff88', marginTop: 20, fontSize: 14 },
  
  // 头部
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerDark: { backgroundColor: '#1a1a2e', borderBottomColor: '#333' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
  headerButtons: { flexDirection: 'row' },
  iconButton: { marginLeft: 10, paddingHorizontal: 10 },
  iconButtonText: { fontSize: 24 },
  searchBar: { padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInput: { backgroundColor: '#f0f0f0', borderRadius: 20, padding: 10, fontSize: 14 },
  
  // 列表
  list: { padding: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // 动态
  post: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10 },
  postDark: { backgroundColor: '#1a1a2e' },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { fontSize: 40, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  timestamp: { fontSize: 12, color: '#999' },
  postContent: { fontSize: 15, color: '#333', marginBottom: 10, lineHeight: 22 },
  hashtagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  hashtag: { color: '#00ff88', marginRight: 8, fontSize: 14 },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  actionButton: { marginRight: 20 },
  actionText: { fontSize: 14, color: '#666' },
  liked: { color: '#ff4444' },
  favorited: { color: '#ffcc00' },
  commentsPreview: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  commentText: { fontSize: 13, color: '#333', marginBottom: 5 },
  commentUser: { fontWeight: 'bold', color: '#1a1a2e' },
  viewAllComments: { color: '#666', fontSize: 13 },
  
  // Modal
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, borderRadius: 15, padding: 20 },
  modalContentDark: { backgroundColor: '#1a1a2e' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#1a1a2e' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, fontSize: 15, minHeight: 120, textAlignVertical: 'top', marginBottom: 15 },
  imagePreview: { marginBottom: 15, position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 10 },
  removeImage: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  removeImageText: { color: '#fff', fontSize: 18 },
  selectImageButton: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  selectImageButtonText: { fontSize: 15, color: '#666' },
  visibilitySelector: { flexDirection: 'row', marginBottom: 15 },
  visibilityLabel: { fontSize: 14, marginRight: 10, alignSelf: 'center' },
  visibilityOption: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', marginHorizontal: 5, backgroundColor: '#f0f0f0' },
  visibilitySelected: { backgroundColor: '#00ff88' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#eee' },
  cancelButtonText: { color: '#666', fontWeight: 'bold' },
  publishButton2: { backgroundColor: '#00ff88' },
  publishButton2Text: { color: '#1a1a2e', fontWeight: 'bold' },
  
  // 评论 Modal
  commentModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  commentModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 30 },
  commentModalTitle: { fontSize: 18, fontWeight: 'bold', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', color: '#1a1a2e' },
  commentsList: { maxHeight: 300 },
  commentItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  commentAvatar: { fontSize: 32, marginRight: 10 },
  commentBody: { flex: 1 },
  commentUsername: { fontWeight: 'bold', color: '#1a1a2e', marginBottom: 3 },
  commentTextFull: { fontSize: 14, color: '#333', marginBottom: 5 },
  commentTime: { fontSize: 12, color: '#999' },
  commentInputContainer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  commentInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  sendComment: { backgroundColor: '#00ff88', borderRadius: 20, paddingHorizontal: 20, justifyContent: 'center' },
  sendCommentText: { color: '#1a1a2e', fontWeight: 'bold' },
  
  // 通知
  notificationItem: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  notificationItemDark: { backgroundColor: '#1a1a2e' },
  notificationRead: { opacity: 0.6 },
  notificationAvatar: { fontSize: 40, marginRight: 15 },
  notificationBody: { flex: 1 },
  notificationUser: { fontWeight: 'bold', color: '#1a1a2e', marginBottom: 3 },
  notificationText: { fontSize: 14, color: '#666' },
  notificationTime: { fontSize: 12, color: '#999', marginTop: 5 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff4444' },
  markReadBtn: { color: '#00ff88', fontWeight: 'bold' },
  
  // 消息
  conversationItem: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  conversationItemDark: { backgroundColor: '#1a1a2e' },
  conversationAvatar: { fontSize: 40, marginRight: 15 },
  conversationInfo: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  conversationName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  conversationTime: { fontSize: 12, color: '#999' },
  conversationLastMessage: { fontSize: 14, color: '#666' },
  unreadBadge: { backgroundColor: '#ff4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  // 个人主页
  profileHeader: { alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  profileHeaderDark: { backgroundColor: '#1a1a2e' },
  profileAvatar: { fontSize: 80 },
  profileName: { fontSize: 24, fontWeight: 'bold', marginTop: 10, color: '#1a1a2e' },
  profileBio: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' },
  editBio: { color: '#00ff88', marginTop: 10 },
  editBioContainer: { width: '100%', marginTop: 10 },
  bioInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, textAlign: 'center' },
  editButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  cancelEdit: { color: '#999' },
  saveEdit: { color: '#00ff88', fontWeight: 'bold' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', padding: 20, marginTop: 10 },
  statsDark: { backgroundColor: '#1a1a2e' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#00ff88' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  profileMenu: { marginTop: 10, backgroundColor: '#fff' },
  profileMenuDark: { backgroundColor: '#1a1a2e' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuIcon: { fontSize: 20, marginRight: 15 },
  menuText: { fontSize: 16, color: '#333' },
  
  // 空状态
  emptyState: { alignItems: 'center', padding: 50 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#999' },
  
  // 发布加载状态
  publishLoadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  publishLoadingText: { color: '#fff', fontSize: 16, marginTop: 10, fontWeight: 'bold' }
});
