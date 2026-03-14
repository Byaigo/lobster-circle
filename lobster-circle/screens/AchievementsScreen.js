/**
 * 成就徽章页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState([]);
  const [filter, setFilter] = useState('all'); // all | completed | in_progress
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await api.get('/achievements/mine');
      const { completed, inProgress, total, completedCount } = response.data.data;
      
      setAchievements([...completed, ...inProgress]);
      setStats({ total, completed: completedCount });
    } catch (error) {
      console.error('加载成就失败:', error);
    }
  };

  // 过滤成就
  const filteredAchievements = achievements.filter(ach => {
    if (filter === 'all') return true;
    if (filter === 'completed') return ach.progress.completed;
    if (filter === 'in_progress') return !ach.progress.completed;
    return true;
  });

  // 渲染成就项
  const renderAchievement = ({ item }) => {
    const isCompleted = item.progress.completed;
    const progress = isCompleted ? 100 : Math.round((item.progress.current / item.progress.target) * 100);

    return (
      <View style={[
        styles.achievementItem,
        !isCompleted && styles.inProgressItem
      ]}>
        <View style={[
          styles.achievementIcon,
          !isCompleted && styles.iconLocked
        ]}>
          <Text style={styles.iconEmoji}>{isCompleted ? item.achievement.icon : '🔒'}</Text>
        </View>
        
        <View style={styles.achievementInfo}>
          <Text style={[
            styles.achievementName,
            !isCompleted && styles.textMuted
          ]}>
            {isCompleted ? item.achievement.name : '???'}
          </Text>
          <Text style={styles.achievementDesc} numberOfLines={2}>
            {isCompleted ? item.achievement.description : item.achievement.hiddenDescription || '???'}
          </Text>
          
          {!isCompleted && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${progress}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {item.progress.current} / {item.progress.target}
              </Text>
            </View>
          )}
          
          {isCompleted && (
            <View style={styles.achievedBadge}>
              <Icon name="checkmark-circle" size={16} color="#4caf50" />
              <Text style={styles.achievedText}>已完成</Text>
            </View>
          )}
        </View>
        
        <View style={[
          styles.rarityBadge,
          styles[`rarity${item.achievement.rarity}`]
        ]}>
          <Text style={styles.rarityText}>
            {item.achievement.rarity === 'common' ? '普' :
             item.achievement.rarity === 'uncommon' ? '罕' :
             item.achievement.rarity === 'rare' ? '稀' :
             item.achievement.rarity === 'epic' ? '史' : '传'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部统计 */}
      <View style={styles.header}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>已完成</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total - stats.completed}</Text>
          <Text style={styles.statLabel\">进行中</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>总计</Text>
        </View>
      </View>

      {/* 筛选 Tab */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: '全部' },
          { key: 'completed', label: '已完成' },
          { key: 'in_progress', label: '进行中' }
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

      {/* 成就列表 */}
      <FlatList
        data={filteredAchievements}
        renderItem={renderAchievement}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
      />
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
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b'
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 8
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
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  inProgressItem: {
    opacity: 0.8
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff9e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  iconLocked: {
    backgroundColor: '#f5f5f5'
  },
  iconEmoji: {
    fontSize: 32
  },
  achievementInfo: {
    flex: 1
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  textMuted: {
    color: '#999'
  },
  achievementDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18
  },
  progressContainer: {
    marginTop: 4
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6b6b',
    borderRadius: 3
  },
  progressText: {
    fontSize: 11,
    color: '#999'
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4
  },
  achievedText: {
    fontSize: 12,
    color: '#4caf50',
    marginLeft: 4
  },
  rarityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  raritycommon: { backgroundColor: '#e0e0e0' },
  rarityuncommon: { backgroundColor: '#c8e6c9' },
  rarityrare: { backgroundColor: '#90caf9' },
  rarityepic: { backgroundColor: '#ce93d8' },
  raritylegendary: { backgroundColor: '#ffd700' },
  rarityText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold'
  }
});
