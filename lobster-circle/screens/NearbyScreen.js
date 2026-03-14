/**
 * 附近的人页面
 * 基于地理位置发现附近用户
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Button,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

export default function NearbyScreen() {
  const navigation = useNavigation();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [radius, setRadius] = useState(10); // 默认 10 公里

  // 获取用户位置
  const getUserLocation = async () => {
    try {
      // 这里需要集成 react-native-geolocation
      // 暂时使用模拟数据
      return {
        latitude: 39.9042, // 北京
        longitude: 116.4074
      };
    } catch (error) {
      console.error('获取位置失败:', error);
      return null;
    }
  };

  // 加载附近的用户
  const loadNearbyUsers = useCallback(async (pageNum = 1) => {
    try {
      const location = await getUserLocation();
      if (!location) {
        Alert.alert('提示', '无法获取您的位置信息');
        setLoading(false);
        return;
      }

      const response = await api.get('/nearby/users', {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          radius: radius,
          page: pageNum,
          limit: 20
        }
      });

      if (pageNum === 1) {
        setUsers(response.data.data);
      } else {
        setUsers(prev => [...prev, ...response.data.data]);
      }
      
      setTotalPages(response.data.pagination.totalPages);
      
      // 加载统计信息
      loadStats(location);
    } catch (error) {
      console.error('加载附近用户失败:', error);
      Alert.alert('错误', '加载失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [radius]);

  // 加载统计信息
  const loadStats = async (location) => {
    try {
      const response = await api.get('/nearby/stats', {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          radius: radius
        }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 更新用户位置
  const updateUserLocation = async () => {
    try {
      const location = await getUserLocation();
      if (!location) return;

      await api.post('/nearby/update-location', {
        lat: location.latitude,
        lng: location.longitude,
        address: '北京市' // 实际应用中需要反向地理编码
      });
    } catch (error) {
      console.error('更新位置失败:', error);
    }
  };

  useEffect(() => {
    loadNearbyUsers();
    updateUserLocation();
  }, []);

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadNearbyUsers(1);
  };

  // 加载更多
  const loadMore = () => {
    if (page >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadNearbyUsers(nextPage);
  };

  // 渲染用户项
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('ProfilePage', { userId: item._id })}
    >
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/100' }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.nickname}</Text>
          {item.onlineStatus === 'online' && (
            <View style={styles.onlineDot} />
          )}
        </View>
        <Text style={styles.userDistance}>
          <Icon name="location" size={12} color="#999" />
          {' '}距离 {item.distance} km
        </Text>
        {item.bio ? (
          <Text style={styles.userBio} numberOfLines={1}>
            {item.bio}
          </Text>
        ) : null}
        <View style={styles.userTags}>
          {item.gender && (
            <View style={[
              styles.tag,
              { backgroundColor: item.gender === 'male' ? '#e3f2fd' : '#fce4ec' }
            ]}>
              <Text style={[
                styles.tagText,
                { color: item.gender === 'male' ? '#1976d2' : '#c2185b' }
              ]}>
                {item.gender === 'male' ? '男生' : '女生'}
              </Text>
            </View>
          )}
          {item.age && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.age}岁</Text>
            </View>
          )}
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  // 渲染空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people-outline" size={80} color="#ddd" />
      <Text style={styles.emptyText}>
        {loading ? '加载中...' : '附近还没有人'}
      </Text>
      <Text style={styles.emptySubtext}>
        去其他地方逛逛吧~
      </Text>
    </View>
  );

  if (loading && users.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>正在查找附近的人...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部统计 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>附近的人</Text>
        {stats && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>附近用户</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4caf50' }]}>
                {stats.online}
              </Text>
              <Text style={styles.statLabel}>在线</Text>
            </View>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() => {/* 切换范围 */}}
            >
              <Icon name="expand" size={16} color="#666" />
              <Text style={styles.radiusText}>{radius}km</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 用户列表 */}
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff6b6b']}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          page < totalPages ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color="#ff6b6b" />
              <Text style={styles.footerText}>加载中...</Text>
            </View>
          ) : null
        }
      />

      {/* 提示 */}
      <View style={styles.tipContainer}>
        <Icon name="information-circle-outline" size={16} color="#999" />
        <Text style={styles.tipText}>
          为了提高匹配度，建议完善个人资料
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b'
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5'
  },
  radiusText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666'
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30
  },
  userInfo: {
    flex: 1,
    marginLeft: 12
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50'
  },
  userDistance: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  userBio: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6
  },
  userTags: {
    flexDirection: 'row'
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginRight: 6
  },
  tagText: {
    fontSize: 11,
    color: '#666'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999'
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#ccc'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16
  },
  footerText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#999'
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  tipText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#999'
  }
});
