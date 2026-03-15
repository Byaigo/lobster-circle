/**
 * 发现页面
 * 
 * 功能：
 * - 推荐用户（热门/新人）
 * - 推荐动态（热门/最新）
 * - 热搜榜单
 * - 快速关注
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  SectionList,
} from 'react-native';
import recommendService from '../services/recommendService';

export default function DiscoverScreen({ navigation, darkMode }) {
  const [activeTab, setActiveTab] = useState('posts'); // posts/users/trends
  const [postsType, setPostsType] = useState('hot'); // hot/latest
  const [usersType, setUsersType] = useState('hot'); // hot/new
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [hotSearches, setHotSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 加载推荐动态
  const loadPosts = async (type = postsType, refresh = false) => {
    if (loading) return;
    
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await recommendService.getRecommendPosts({
        type,
        limit: 20,
        page: refresh ? 1 : Math.floor(posts.length / 20) + 1,
      });

      if (refresh) {
        setPosts(result.posts || []);
      } else {
        setPosts([...posts, ...(result.posts || [])]);
      }
      
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('加载推荐动态失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 加载推荐用户
  const loadUsers = async (type = usersType, refresh = false) => {
    if (loading) return;

    try {
      const result = await recommendService.getRecommendUsers({
        type,
        limit: 20,
        page: refresh ? 1 : Math.floor(users.length / 20) + 1,
      });

      if (refresh) {
        setUsers(result.users || []);
      } else {
        setUsers([...users, ...(result.users || [])]);
      }
    } catch (error) {
      console.error('加载推荐用户失败:', error);
    }
  };

  // 加载热搜
  const loadHotSearches = async () => {
    try {
      const result = await recommendService.getHotSearches('24h');
      setHotSearches(result.hashtags || []);
    } catch (error) {
      console.error('加载热搜失败:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'posts') {
      loadPosts(postsType, true);
    } else if (activeTab === 'users') {
      loadUsers(usersType, true);
    } else if (activeTab === 'trends') {
      loadHotSearches();
    }
  }, [activeTab, postsType, usersType]);

  // 关注/取消关注
  const handleFollow = async (user, index) => {
    const success = user.isFollowing
      ? await recommendService.unfollowUser(user.id)
      : await recommendService.followUser(user.id);

    if (success) {
      const newUsers = [...users];
      newUsers[index] = { ...user, isFollowing: !user.isFollowing };
      setUsers(newUsers);
    }
  };

  // 渲染动态项
  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={[styles.postCard, darkMode && styles.postCardDark]}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
    >
      <View style={styles.postHeader}>
        <Text style={styles.avatar}>{item.user?.avatar || '😐'}</Text>
        <View style={styles.postInfo}>
          <Text style={[styles.username, darkMode && styles.textDark]}>
            {item.user?.username || '未知用户'}
          </Text>
          <Text style={styles.postTime}>{item.timestamp || '刚刚'}</Text>
        </View>
      </View>
      
      <Text style={[styles.postContent, darkMode && styles.textDark]} numberOfLines={3}>
        {item.content}
      </Text>
      
      {item.images && item.images.length > 0 && (
        <Image
          source={{ uri: item.images[0].url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.postStats}>
        <Text style={styles.statItem}>❤️ {item.likeCount || 0}</Text>
        <Text style={styles.statItem}>💬 {item.commentCount || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  // 渲染用户项
  const renderUser = ({ item, index }) => (
    <View style={[styles.userCard, darkMode && styles.userCardDark]}>
      <View style={styles.userHeader}>
        <Text style={styles.userAvatar}>{item.avatar || '😐'}</Text>
        <View style={styles.userInfo}>
          <Text style={[styles.userUsername, darkMode && styles.textDark]}>
            {item.username}
          </Text>
          <Text style={styles.userBio} numberOfLines={1}>
            {item.bio || '这个人很懒，什么都没写'}
          </Text>
        </View>
      </View>
      
      <View style={styles.userStats}>
        <Text style={styles.userStat}>
          <Text style={styles.userStatNum}>{item.followers || 0}</Text> 粉丝
        </Text>
        <Text style={styles.userStat}>
          <Text style={styles.userStatNum}>{item.following || 0}</Text> 关注
        </Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.followButton,
          item.isFollowing && styles.followingButton,
        ]}
        onPress={() => handleFollow(item, index)}
      >
        <Text style={[
          styles.followButtonText,
          item.isFollowing && styles.followingButtonText,
        ]}>
          {item.isFollowing ? '已关注' : '+ 关注'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染热搜项
  const renderTrend = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.trendItem, darkMode && styles.trendItemDark]}
      onPress={() => navigation.navigate('Search', { query: item.tag })}
    >
      <Text style={[styles.trendRank, index < 3 && styles.trendRankHot]}>
        {index + 1}
      </Text>
      <View style={styles.trendInfo}>
        <Text style={[styles.trendTag, darkMode && styles.textDark]}>
          {item.tag}
        </Text>
        <Text style={styles.trendCount}>{item.count || 0} 讨论</Text>
      </View>
    </TouchableOpacity>
  );

  // 渲染标签页
  const renderTab = (id, label, currentType, setType) => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === id && styles.tabActive,
          darkMode && styles.tabDark,
        ]}
        onPress={() => setActiveTab(id)}
      >
        <Text style={[
          styles.tabText,
          activeTab === id && styles.tabTextActive,
          darkMode && styles.textDark,
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
      
      {activeTab === id && (
        <View style={styles.subTabContainer}>
          {id === 'posts' && (
            <>
              <TouchableOpacity
                style={[styles.subTab, postsType === 'hot' && styles.subTabActive]}
                onPress={() => { setPostsType('hot'); loadPosts('hot', true); }}
              >
                <Text style={styles.subTabText}>🔥 热门</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subTab, postsType === 'latest' && styles.subTabActive]}
                onPress={() => { setPostsType('latest'); loadPosts('latest', true); }}
              >
                <Text style={styles.subTabText}>🆕 最新</Text>
              </TouchableOpacity>
            </>
          )}
          {id === 'users' && (
            <>
              <TouchableOpacity
                style={[styles.subTab, usersType === 'hot' && styles.subTabActive]}
                onPress={() => { setUsersType('hot'); loadUsers('hot', true); }}
              >
                <Text style={styles.subTabText}>🔥 热门</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subTab, usersType === 'new' && styles.subTabActive]}
                onPress={() => { setUsersType('new'); loadUsers('new', true); }}
              >
                <Text style={styles.subTabText}>🆕 新人</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>🧭 发现</Text>
      </View>

      {/* 标签页 */}
      <View style={styles.tabs}>
        {renderTab('posts', '动态', postsType, setPostsType)}
        {renderTab('users', '用户', usersType, setUsersType)}
        {renderTab('trends', '热搜', null, null)}
      </View>

      {/* 内容区域 */}
      {activeTab === 'posts' && (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPosts(postsType, true)}
              colors={['#00ff88']}
            />
          }
          onEndReached={() => hasMore && loadPosts(postsType)}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>暂无推荐动态</Text>
            </View>
          }
          ListFooterComponent={loading && <ActivityIndicator style={styles.loader} />}
        />
      )}

      {activeTab === 'users' && (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadUsers(usersType, true)}
              colors={['#00ff88']}
            />
          }
          numColumns={2}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>暂无推荐用户</Text>
            </View>
          }
        />
      )}

      {activeTab === 'trends' && (
        <FlatList
          data={hotSearches}
          renderItem={renderTrend}
          keyExtractor={item => item.tag}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadHotSearches}
              colors={['#00ff88']}
            />
          }
          ListHeaderComponent={
            <View style={[styles.trendsHeader, darkMode && styles.trendsHeaderDark]}>
              <Text style={[styles.trendsTitle, darkMode && styles.textDark]}>
                🔥 24 小时热搜榜
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>暂无热搜数据</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#0f0f1a',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerDark: {
    backgroundColor: '#1a1a2e',
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  tabs: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#00ff88',
  },
  tabDark: {
    backgroundColor: '#1a1a2e',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#00ff88',
    fontWeight: 'bold',
  },
  subTabContainer: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  subTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  subTabActive: {
    backgroundColor: '#00ff88',
  },
  subTabText: {
    fontSize: 13,
    color: '#666',
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    padding: 15,
  },
  postCardDark: {
    backgroundColor: '#1a1a2e',
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatar: {
    fontSize: 40,
    marginRight: 10,
  },
  postInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  postTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postStats: {
    flexDirection: 'row',
  },
  statItem: {
    fontSize: 13,
    color: '#666',
    marginRight: 20,
  },
  userCard: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 5,
    borderRadius: 10,
    padding: 15,
    minWidth: '45%',
  },
  userCardDark: {
    backgroundColor: '#1a1a2e',
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  userAvatar: {
    fontSize: 40,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userUsername: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 3,
  },
  userBio: {
    fontSize: 12,
    color: '#999',
  },
  userStats: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  userStat: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
  },
  userStatNum: {
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  followButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
  },
  followButtonText: {
    color: '#1a1a2e',
    fontSize: 14,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#666',
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  trendItemDark: {
    backgroundColor: '#1a1a2e',
    borderBottomColor: '#333',
  },
  trendRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    width: 30,
  },
  trendRankHot: {
    color: '#ff4444',
  },
  trendInfo: {
    flex: 1,
  },
  trendTag: {
    fontSize: 15,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  trendCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  trendsHeader: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  trendsHeaderDark: {
    backgroundColor: '#1a1a2e',
    borderBottomColor: '#333',
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  empty: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  loader: {
    marginVertical: 20,
  },
  textDark: {
    color: '#fff',
  },
});
