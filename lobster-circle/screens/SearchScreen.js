/**
 * 搜索页面 - 增强版
 * 支持搜索历史、热门搜索、综合搜索
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_HISTORY = 10;

export default function SearchScreen({ darkMode, navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [hotSearches, setHotSearches] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, results

  useEffect(() => {
    loadSearchHistory();
    loadHotSearches();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  };

  const saveSearchHistory = async (query) => {
    try {
      let history = searchHistory.filter(item => item !== query);
      history = [query, ...history].slice(0, MAX_HISTORY);
      setSearchHistory(history);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(history));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };

  const clearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem('searchHistory');
    } catch (error) {
      console.error('清除搜索历史失败:', error);
    }
  };

  const loadHotSearches = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/hashtags/trending?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.hashtags) {
        setHotSearches(data.hashtags.map(h => h.tag));
      }
    } catch (error) {
      console.error('加载热搜失败:', error);
      setHotSearches(['#龙虾圈', '#今日心情', '#美食分享', '#旅行日记', '#日常']);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    saveSearchHistory(searchQuery);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSearchResults(data);
      setActiveTab('results');
    } catch (error) {
      console.error('搜索失败:', error);
      // 模拟搜索结果
      setSearchResults({
        users: [{ _id: '1', username: '测试用户', avatar: '😎' }],
        posts: [{ _id: '1', content: '测试动态', userId: { username: '测试用户' } }],
      });
      setActiveTab('results');
    } finally {
      setLoading(false);
    }
  };

  const handleHotSearch = (tag) => {
    setSearchQuery(tag);
    handleSearch();
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        setSearchQuery(item);
        handleSearch();
      }}
    >
      <Text style={styles.historyIcon}>🕐</Text>
      <Text style={styles.historyText}>{item}</Text>
      <TouchableOpacity onPress={() => {
        const newHistory = searchHistory.filter(h => h !== item);
        setSearchHistory(newHistory);
        AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHotItem = ({ item }) => (
    <TouchableOpacity
      style={styles.hotItem}
      onPress={() => handleHotSearch(item)}
    >
      <Text style={styles.hotIcon}>🔥</Text>
      <Text style={styles.hotText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderResult = ({ item, type }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => {
        if (type === 'user') {
          navigation.navigate('UserProfile', { userId: item._id });
        } else {
          navigation.navigate('PostDetail', { postId: item._id });
        }
      }}
    >
      <Text style={styles.resultAvatar}>{item.avatar || '📄'}</Text>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.username || item.content}</Text>
        <Text style={styles.resultDesc}>{item.bio || `发布于 ${new Date(item.createdAt).toLocaleDateString()}`}</Text>
      </View>
      <Text style={styles.resultType}>{type === 'user' ? '👤 用户' : '📝 动态'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* 搜索框 */}
      <View style={[styles.searchBar, darkMode && styles.searchBarDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.searchInput, darkMode && styles.inputDark]}
          placeholder="搜索用户或动态"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          autoFocus
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults(null); setActiveTab('home'); }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={[styles.loadingText, darkMode && styles.textMuted]}>搜索中...</Text>
        </View>
      ) : activeTab === 'home' ? (
        <FlatList
          data={[]}
          ListHeaderComponent={
            <>
              {/* 搜索历史 */}
              {searchHistory.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>🕐 搜索历史</Text>
                    <TouchableOpacity onPress={clearSearchHistory}>
                      <Text style={styles.clearHistory}>清除</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={searchHistory}
                    renderItem={renderHistoryItem}
                    keyExtractor={item => item}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {/* 热门搜索 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>🔥 热门搜索</Text>
                <FlatList
                  data={hotSearches}
                  renderItem={renderHotItem}
                  keyExtractor={item => item}
                  numColumns={2}
                  scrollEnabled={false}
                />
              </View>
            </>
          }
        />
      ) : (
        <View style={styles.resultsContainer}>
          {/* 结果分类 */}
          <View style={styles.tabs}>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>全部</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>用户</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>动态</Text>
            </TouchableOpacity>
          </View>

          {/* 搜索结果 */}
          <FlatList
            data={[
              ...(searchResults?.users || []).map(u => ({ ...u, type: 'user' })),
              ...(searchResults?.posts || []).map(p => ({ ...p, type: 'post' })),
            ]}
            renderItem={({ item }) => renderResult({ item, type: item.type })}
            keyExtractor={item => item._id + item.type}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={[styles.emptyText, darkMode && styles.textDark]}>未找到结果</Text>
                <Text style={[styles.emptySubtext, darkMode && styles.textMuted]}>换个关键词试试</Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { flex: 1, backgroundColor: '#0f0f1a' },
  textDark: { color: '#fff' },
  textMuted: { color: '#888' },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 10, padding: 10, backgroundColor: '#fff', borderRadius: 10 },
  searchBarDark: { backgroundColor: '#1a1a2e' },
  backButton: { padding: 5 },
  backButtonText: { fontSize: 24, color: '#00ff88' },
  searchInput: { flex: 1, marginHorizontal: 10, fontSize: 15 },
  inputDark: { color: '#fff' },
  clearIcon: { fontSize: 20, color: '#999', padding: 5 },
  searchIcon: { fontSize: 20, padding: 5 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14 },
  
  section: { margin: 10, padding: 15, backgroundColor: '#fff', borderRadius: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  clearHistory: { color: '#999', fontSize: 14 },
  
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  historyIcon: { fontSize: 18, marginRight: 10 },
  historyText: { flex: 1, fontSize: 15, color: '#333' },
  deleteIcon: { fontSize: 18, color: '#999', padding: 5 },
  
  hotItem: { flexDirection: 'row', alignItems: 'center', width: '50%', paddingVertical: 10 },
  hotIcon: { fontSize: 18, marginRight: 5 },
  hotText: { fontSize: 15, color: '#333' },
  
  resultsContainer: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingHorizontal: 10 },
  tab: { paddingVertical: 10, paddingHorizontal: 15 },
  tabText: { fontSize: 15, color: '#666' },
  
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  resultAvatar: { fontSize: 40, marginRight: 15 },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 3 },
  resultDesc: { fontSize: 13, color: '#999' },
  resultType: { fontSize: 12, color: '#00ff88' },
  
  emptyState: { alignItems: 'center', padding: 50 },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center' },
});
