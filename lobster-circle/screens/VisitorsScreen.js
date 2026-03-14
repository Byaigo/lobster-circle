/**
 * 访客记录页面
 * 查看谁访问了我的主页
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
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

export default function VisitorsScreen() {
  const navigation = useNavigation();
  
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  // 加载访客列表
  const loadVisitors = useCallback(async () => {
    try {
      const [visitorsRes, statsRes] = await Promise.all([
        api.get('/visitors'),
        api.get('/visitors/stats')
      ]);
      
      setVisitors(visitorsRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('加载访客失败:', error);
      Alert.alert('错误', '加载失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVisitors();
    }, [])
  );

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    loadVisitors();
  };

  // 标记全部已读
  const markAllAsRead = async () => {
    try {
      await api.post('/visitors/mark-read');
      loadVisitors();
      Alert.alert('成功', '已标记全部已读');
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  // 渲染访客项
  const renderVisitorItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.visitorItem, !item.isRead && styles.unreadItem]}
      onPress={() => {
        if (item.visitor._id === 'anonymous') {
          Alert.alert('神秘访客', '该用户选择了匿名访问');
        } else {
          navigation.navigate('ProfilePage', { userId: item.visitor._id });
        }
      }}
    >
      {item.visitor._id === 'anonymous' ? (
        <View style={styles.anonymousAvatar}>
          <Icon name="person" size={30} color="#999" />
        </View>
      ) : (
        <Image
          source={{ uri: item.visitor.avatar || 'https://via.placeholder.com/100' }}
          style={styles.visitorAvatar}
        />
      )}
      <View style={styles.visitorInfo}>
        <View style={styles.visitorHeader}>
          <Text style={styles.visitorName}>
            {item.visitor._id === 'anonymous' ? '神秘访客' : item.visitor.nickname}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.visitTime}>
          {formatTime(new Date(item.createdAt))}
        </Text>
        <Text style={styles.visitType}>
          {item.type === 'profile' ? '访问了主页' : 
           item.type === 'moment' ? '查看了动态' : '浏览了相册'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  // 格式化时间
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 渲染空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="eye-outline" size={80} color="#ddd" />
      <Text style={styles.emptyText}>还没有访客</Text>
      <Text style={styles.emptySubtext}>
        多发布动态，吸引更多人来访问吧~
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部统计 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>访客记录</Text>
        {stats && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.today}</Text>
              <Text style={styles.statLabel}>今日</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.thisWeek}</Text>
              <Text style={styles.statLabel}>本周</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>总计</Text>
            </View>
            {stats.unread > 0 && (
              <TouchableOpacity 
                style={styles.markReadButton}
                onPress={markAllAsRead}
              >
                <Text style={styles.markReadText}>
                  {stats.unread}条未读
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* 访客列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
        </View>
      ) : (
        <FlatList
          data={visitors}
          renderItem={renderVisitorItem}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff6b6b']}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* 提示 */}
      <View style={styles.tipContainer}>
        <Icon name="information-circle-outline" size={16} color="#999" />
        <Text style={styles.tipText}>
          开通会员可查看匿名访客的真实身份
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
    marginBottom: 12
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    alignItems: 'center',
    paddingRight: 16
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
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#eee',
    marginRight: 16
  },
  markReadButton: {
    marginLeft: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffebee'
  },
  markReadText: {
    fontSize: 13,
    color: '#ff6b6b',
    fontWeight: 'bold'
  },
  visitorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  unreadItem: {
    backgroundColor: '#fff9f9'
  },
  visitorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  anonymousAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  visitorInfo: {
    flex: 1,
    marginLeft: 12
  },
  visitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  visitorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b'
  },
  visitTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2
  },
  visitType: {
    fontSize: 12,
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
