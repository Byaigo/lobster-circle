/**
 * 群组列表页面
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

export default function GroupsScreen() {
  const navigation = useNavigation();
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('joined'); // 'joined' | 'explore'

  // 加载群组
  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'joined' ? '/groups' : '/groups/explore';
      const response = await api.get(endpoint);
      
      setGroups(response.data.data);
    } catch (error) {
      console.error('加载群组失败:', error);
      Alert.alert('错误', '加载失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  // 渲染群组项
  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => navigation.navigate('GroupDetail', { groupId: item._id })}
    >
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/100' }}
        style={styles.groupAvatar}
      />
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{item.name}</Text>
          {item.settings?.joinType === 'open' ? (
            <View style={styles.publicTag}>
              <Text style={styles.publicTagText}>公开</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description || '暂无描述'}
        </Text>
        <View style={styles.groupStats}>
          <View style={styles.statItem}>
            <Icon name="people" size={14} color="#999" />
            <Text style={styles.statText}>{item.stats?.memberCount || 0}人</Text>
          </View>
          {activeTab === 'joined' && item.unreadCount ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}条新消息</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  // 渲染空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon 
        name={activeTab === 'joined' ? 'people-outline' : 'search-outline'} 
        size={80} 
        color="#ddd" 
      />
      <Text style={styles.emptyText}>
        {activeTab === 'joined' ? '你还没加入任何群组' : '暂无推荐群组'}
      </Text>
      {activeTab === 'joined' && (
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={styles.exploreButtonText}>去探索</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部 Tab */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'joined' && styles.activeTabText
          ]}>
            我的群组
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'explore' && styles.activeTab]}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'explore' && styles.activeTabText
          ]}>
            探索群组
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 群组列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff6b6b'
  },
  tabText: {
    fontSize: 15,
    color: '#666'
  },
  activeTabText: {
    color: '#ff6b6b',
    fontWeight: 'bold'
  },
  createButton: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  groupAvatar: {
    width: 60,
    height: 60,
    borderRadius: 8
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8
  },
  publicTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50'
  },
  publicTagText: {
    fontSize: 10,
    color: '#4caf50'
  },
  groupDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  statText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#ff6b6b'
  },
  unreadText: {
    fontSize: 11,
    color: '#fff'
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
  exploreButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#ff6b6b'
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  }
});
