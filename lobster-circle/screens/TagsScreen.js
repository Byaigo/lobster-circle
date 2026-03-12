/**
 * 标签选择页面
 * 用户兴趣标签管理
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, Alert } from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TagsScreen({ darkMode, navigation }) {
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // 获取推荐标签
      const tagsRes = await fetch(`${API_BASE_URL}/tags/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tagsData = await tagsRes.json();
      setAvailableTags(tagsData.tags || []);

      // 获取用户已选标签
      const userRes = await fetch(`${API_BASE_URL}/tags/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      setSelectedTags(userData.tags || []);
    } catch (error) {
      console.error('加载数据失败:', error);
      // 使用默认标签
      setAvailableTags(['🎮 游戏', '🎵 音乐', '🎬 电影', '📚 阅读', '✈️ 旅行', '🍳 美食', '🏃 运动', '🎨 艺术', '💻 科技', '📷 摄影']);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 10) {
        Alert.alert('提示', '最多选择 10 个标签');
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const saveTags = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_BASE_URL}/tags/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: selectedTags }),
      });
      Alert.alert('保存成功', '兴趣标签已更新');
      navigation.goBack();
    } catch (error) {
      Alert.alert('错误', '保存失败');
    }
  };

  const renderTag = ({ item }) => {
    const isSelected = selectedTags.includes(item);
    return (
      <TouchableOpacity
        style={[styles.tag, isSelected && styles.tagSelected, darkMode && styles.tagDark]}
        onPress={() => toggleTag(item)}
      >
        <Text style={[styles.tagText, isSelected && styles.tagTextSelected, darkMode && styles.tagTextDark]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

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
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>🏷️ 兴趣标签</Text>
        <TouchableOpacity onPress={saveTags}>
          <Text style={styles.saveButton}>保存</Text>
        </TouchableOpacity>
      </View>

      {/* 说明 */}
      <View style={[styles.infoCard, darkMode && styles.infoCardDark]}>
        <Text style={[styles.infoText, darkMode && styles.textMuted]}>
          选择你的兴趣标签，帮助我们为你推荐更优质的内容和朋友。
          {'\n'}已选择 {selectedTags.length}/10 个
        </Text>
      </View>

      {/* 标签列表 */}
      <FlatList
        data={availableTags}
        renderItem={renderTag}
        keyExtractor={item => item}
        numColumns={2}
        contentContainerStyle={styles.tagList}
      />

      {/* 已选标签预览 */}
      {selectedTags.length > 0 && (
        <View style={[styles.selectedSection, darkMode && styles.selectedSectionDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>已选择</Text>
          <View style={styles.selectedTags}>
            {selectedTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.selectedTag, darkMode && styles.selectedTagDark]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.selectedTagText, darkMode && styles.textDark]}>{tag}</Text>
                <Text style={styles.removeIcon}> ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  loadingText: { fontSize: 16, textAlign: 'center', marginTop: 50 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerDark: { backgroundColor: '#1a1a2e', borderBottomColor: '#333' },
  backButton: { fontSize: 24, color: '#00ff88', paddingHorizontal: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  saveButton: { color: '#00ff88', fontWeight: 'bold', paddingHorizontal: 10 },
  
  infoCard: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10 },
  infoCardDark: { backgroundColor: '#1a1a2e' },
  infoText: { fontSize: 14, lineHeight: 20 },
  
  tagList: { padding: 15 },
  tag: { flex: 1, margin: 5, padding: 15, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center' },
  tagDark: { backgroundColor: '#1a1a2e' },
  tagSelected: { backgroundColor: '#00ff88' },
  tagText: { fontSize: 15, color: '#333' },
  tagTextSelected: { color: '#1a1a2e', fontWeight: 'bold' },
  tagTextDark: { color: '#fff' },
  
  selectedSection: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10 },
  selectedSectionDark: { backgroundColor: '#1a1a2e' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#1a1a2e' },
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap' },
  selectedTag: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#f0f0f0', borderRadius: 20, marginRight: 10, marginBottom: 10 },
  selectedTagDark: { backgroundColor: '#2a2a3e' },
  selectedTagText: { fontSize: 14, color: '#333' },
  removeIcon: { fontSize: 14, color: '#999', marginLeft: 5 },
});
