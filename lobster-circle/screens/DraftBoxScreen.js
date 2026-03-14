/**
 * 草稿箱页面
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

export default function DraftBoxScreen() {
  const navigation = useNavigation();
  
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 加载草稿
  const loadDrafts = useCallback(async () => {
    try {
      const response = await api.get('/drafts');
      setDrafts(response.data.data);
    } catch (error) {
      console.error('加载草稿失败:', error);
      Alert.alert('错误', '加载失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [])
  );

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    loadDrafts();
  };

  // 删除草稿
  const deleteDraft = async (id) => {
    Alert.alert('删除草稿', '确定要删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/drafts/${id}`);
            loadDrafts();
            Alert.alert('成功', '草稿已删除');
          } catch (error) {
            Alert.alert('错误', '删除失败');
          }
        }
      }
    ]);
  };

  // 发布草稿
  const publishDraft = async (id) => {
    try {
      const response = await api.post(`/drafts/${id}/publish`);
      Alert.alert('成功', '发布成功！');
      loadDrafts();
    } catch (error) {
      Alert.alert('错误', error.response?.data?.error || '发布失败');
    }
  };

  // 编辑草稿
  const editDraft = (draft) => {
    navigation.navigate('CreatePost', { draft });
  };

  // 格式化时间
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return `${new Date(date).getMonth() + 1}月${new Date(date).getDate()}日`;
  };

  // 渲染草稿项
  const renderDraftItem = ({ item }) => (
    <TouchableOpacity
      style={styles.draftItem}
      onPress={() => editDraft(item)}
      onLongPress={() => showDraftOptions(item)}
    >
      <View style={styles.draftContent}>
        <Text style={styles.draftText} numberOfLines={3}>
          {item.content || '（无文字内容）'}
        </Text>
        
        {(item.images?.length > 0 || item.poll) && (
          <View style={styles.draftMeta}>
            {item.images?.length > 0 && (
              <View style={styles.metaTag}>
                <Icon name="images" size={14} color="#ff6b6b" />
                <Text style={styles.metaText}>{item.images.length}张图</Text>
              </View>
            )}
            {item.poll && (
              <View style={styles.metaTag}>
                <Icon name="stats-chart" size={14} color="#4caf50" />
                <Text style={styles.metaText}>投票</Text>
              </View>
            )}
            {item.scheduledAt && (
              <View style={styles.metaTag}>
                <Icon name="time" size={14} color="#2196f3" />
                <Text style={styles.metaText}>定时</Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.draftFooter}>
        <Text style={styles.draftTime}>{formatTime(item.updatedAt)}</Text>
        <View style={styles.draftActions}>
          <TouchableOpacity
            style={styles.publishButton}
            onPress={() => publishDraft(item._id)}
          >
            <Icon name="send" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteDraft(item._id)}
          >
            <Icon name="trash" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 显示操作菜单
  const showDraftOptions = (draft) => {
    Alert.alert('草稿操作', draft.content?.substring(0, 20) || '草稿', [
      { text: '编辑', onPress: () => editDraft(draft) },
      { text: '发布', onPress: () => publishDraft(draft._id) },
      { text: '删除', style: 'destructive', onPress: () => deleteDraft(draft._id) },
      { text: '取消', style: 'cancel' }
    ]);
  };

  // 渲染空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="document-text-outline" size={80} color="#ddd" />
      <Text style={styles.emptyText}>草稿箱空空如也</Text>
      <Text style={styles.emptySubtext}>
        发布内容时中途退出会自动保存为草稿
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Icon name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>发布动态</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>草稿箱</Text>
        <Text style={styles.headerCount}>{drafts.length}篇草稿</Text>
      </View>

      {/* 草稿列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
        </View>
      ) : (
        <FlatList
          data={drafts}
          renderItem={renderDraftItem}
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
          草稿自动保存，7 天后自动清理
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  headerCount: {
    fontSize: 14,
    color: '#999'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  draftItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  draftContent: {
    marginBottom: 12
  },
  draftText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8
  },
  draftMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  draftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12
  },
  draftTime: {
    fontSize: 12,
    color: '#999'
  },
  draftActions: {
    flexDirection: 'row'
  },
  publishButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
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
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 40
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8
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
