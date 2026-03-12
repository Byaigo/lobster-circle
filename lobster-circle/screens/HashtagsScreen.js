/**
 * 热门话题页面
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HashtagsScreen({ darkMode, navigation }) {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHashtags();
  }, []);

  const loadHashtags = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/hashtags/trending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.hashtags) {
        setHashtags(data.hashtags);
      }
    } catch (error) {
      console.error('加载话题失败:', error);
      // 使用模拟数据
      setHashtags([
        { tag: '#龙虾圈', count: 1234 },
        { tag: '#今日心情', count: 856 },
        { tag: '#美食分享', count: 642 },
        { tag: '#旅行日记', count: 521 },
        { tag: '#日常', count: 489 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHashtags();
    setRefreshing(false);
  };

  const renderHashtag = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.hashtagItem, darkMode && styles.hashtagItemDark]}
      onPress={() => navigation.navigate('HashtagDetail', { tag: item.tag })}
    >
      <View style={styles.rankBox}>
        <Text style={[styles.rank, index < 3 && styles.rankHot]}>
          {index < 3 ? ['🔥', '🥈', '🥉'][index] : `#${index + 1}`}
        </Text>
      </View>
      <View style={styles.hashtagInfo}>
        <Text style={[styles.hashtagText, darkMode && styles.textDark]}>{item.tag}</Text>
        <Text style={[styles.hashtagCount, darkMode && styles.textMuted]}>
          {item.count} 条动态
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>🔥 热门话题</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 说明 */}
      <View style={[styles.infoCard, darkMode && styles.infoCardDark]}>
        <Text style={[styles.infoText, darkMode && styles.textMuted]}>
          实时热门话题，发现更多精彩内容
        </Text>
      </View>

      {/* 列表 */}
      <FlatList
        data={hashtags}
        renderItem={renderHashtag}
        keyExtractor={item => item.tag}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00ff88']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyText, darkMode && styles.textDark]}>暂无热门话题</Text>
            <Text style={[styles.emptySubtext, darkMode && styles.textMuted]}>
              发条动态成为第一个创作者吧
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
  loadingText: { fontSize: 16, textAlign: 'center', marginTop: 50 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerDark: { backgroundColor: '#1a1a2e', borderBottomColor: '#333' },
  backButton: { fontSize: 24, color: '#00ff88', paddingHorizontal: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  
  infoCard: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10 },
  infoCardDark: { backgroundColor: '#1a1a2e' },
  infoText: { fontSize: 14, color: '#666' },
  
  list: { padding: 10 },
  hashtagItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10 },
  hashtagItemDark: { backgroundColor: '#1a1a2e' },
  rankBox: { width: 50, alignItems: 'center' },
  rank: { fontSize: 24 },
  rankHot: { fontSize: 28 },
  hashtagInfo: { flex: 1 },
  hashtagText: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 5 },
  hashtagCount: { fontSize: 13, color: '#999' },
  arrow: { fontSize: 24, color: '#ccc' },
  
  emptyState: { alignItems: 'center', padding: 50 },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center' },
});
