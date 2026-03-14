/**
 * 主题选择页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

export default function ThemeSelectorScreen() {
  const navigation = useNavigation();
  
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [filter, setFilter] = useState('all'); // all | light | dark | premium

  // 加载主题
  useEffect(() => {
    loadThemes();
  }, [filter]);

  const loadThemes = async () => {
    try {
      const response = await api.get(`/customize/themes?type=${filter}`);
      setThemes(response.data.data);
      
      // 获取当前主题
      const current = themes.find(t => t.key === currentTheme);
      if (current) setCurrentTheme(current.key);
    } catch (error) {
      Alert.alert('错误', '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 应用主题
  const applyTheme = async (theme) => {
    try {
      await api.post('/customize/themes/apply', { themeKey: theme.key });
      setCurrentTheme(theme.key);
      Alert.alert('成功', `已应用 ${theme.name} 主题`);
    } catch (error) {
      Alert.alert('错误', error.response?.data?.error || '应用失败');
    }
  };

  // 预览主题
  const previewTheme = (theme) => {
    navigation.navigate('ThemePreview', { theme });
  };

  // 渲染主题项
  const renderThemeItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.themeItem,
        item.key === currentTheme && styles.currentThemeItem,
        { backgroundColor: item.colors.surface }
      ]}
      onPress={() => applyTheme(item)}
      onLongPress={() => previewTheme(item)}
    >
      {/* 预览色块 */}
      <View style={styles.colorPreview}>
        <View style={[
          styles.colorDot,
          { backgroundColor: item.colors.primary }
        ]} />
        <View style={[
          styles.colorDot,
          { backgroundColor: item.colors.background }
        ]} />
        <View style={[
          styles.colorDot,
          { backgroundColor: item.colors.textPrimary }
        ]} />
      </View>
      
      {/* 主题信息 */}
      <View style={styles.themeInfo}>
        <Text style={[
          styles.themeName,
          { color: item.colors.textPrimary }
        ]}>
          {item.name}
        </Text>
        {item.description && (
          <Text
            style={[
              styles.themeDesc,
              { color: item.colors.textSecondary }
            ]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        )}
        <View style={styles.themeTags}>
          {item.isDark && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>深色</Text>
            </View>
          )}
          {item.isPremium && (
            <View style={[styles.tag, styles.premiumTag]}>
              <Icon name="diamond" size={12} color="#ffd700" />
              <Text style={[styles.tagText, styles.premiumTagText]}>VIP</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* 当前标记 */}
      {item.key === currentTheme && (
        <View style={styles.currentBadge}>
          <Icon name="checkmark-circle" size={24} color={item.colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>主题皮肤</Text>
        <Text style={styles.headerCount}>{themes.length}个主题</Text>
      </View>

      {/* 筛选 Tab */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: '全部' },
          { key: 'light', label: '浅色' },
          { key: 'dark', label: '深色' },
          { key: 'premium', label: 'VIP' }
        ].map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterTab,
              filter === item.key && styles.activeFilterTab
            ]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[
              styles.filterText,
              filter === item.key && styles.activeFilterText
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 主题列表 */}
      <FlatList
        data={themes}
        renderItem={renderThemeItem}
        keyExtractor={item => item.key}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.listRow}
      />

      {/* 提示 */}
      <View style={styles.tipContainer}>
        <Icon name="information-circle-outline" size={16} color="#999" />
        <Text style={styles.tipText}>
          长按预览主题效果，点击应用主题
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5'
  },
  activeFilterTab: {
    backgroundColor: '#ff6b6b'
  },
  filterText: {
    fontSize: 13,
    color: '#666'
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  listContent: {
    padding: 16
  },
  listRow: {
    justifyContent: 'space-between',
    marginBottom: 16
  },
  themeItem: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  currentThemeItem: {
    borderWidth: 2,
    borderColor: '#ff6b6b'
  },
  colorPreview: {
    flexDirection: 'row',
    marginBottom: 12
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#eee'
  },
  themeInfo: {
    flex: 1
  },
  themeName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4
  },
  themeDesc: {
    fontSize: 12,
    marginBottom: 8
  },
  themeTags: {
    flexDirection: 'row'
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 4
  },
  tagText: {
    fontSize: 10,
    color: '#666'
  },
  premiumTag: {
    backgroundColor: '#fff9e6'
  },
  premiumTagText: {
    color: '#f5a623'
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8
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
