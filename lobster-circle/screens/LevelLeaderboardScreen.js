/**
 * 等级排行榜页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

export default function LevelLeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);
  const [myLevel, setMyLevel] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await api.get('/level/leaderboard', {
        params: { page: 1, limit: 50 }
      });
      setLeaderboard(response.data.data);
      setMyRank(response.data.myRank);
      
      // 获取我的等级
      const myRes = await api.get('/level/me');
      setMyLevel(myRes.data.data);
    } catch (error) {
      console.error('加载排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染排名图标
  const renderRankIcon = (index) => {
    const rank = index + 1;
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // 渲染榜单项
  const renderItem = ({ item, index }) => {
    const rank = index + 1;
    const isTop3 = rank <= 3;

    return (
      <View style={[
        styles.item,
        isTop3 && styles.topItem
      ]}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankIcon}>{renderRankIcon(index)}</Text>
        </View>
        
        <Image
          source={{ uri: item.user?.avatar || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        
        <View style={styles.userInfo}>
          <Text style={[
            styles.userName,
            isTop3 && styles.topUserName
          ]}>
            {item.user?.nickname}
          </Text>
          <Text style={styles.userTitle}>{item.title}</Text>
        </View>
        
        <View style={styles.levelInfo}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{item.level}</Text>
          </View>
          <Text style={styles.expText}>{item.totalExp} 经验</Text>
        </View>
      </View>
    );
  };

  // 渲染我的排名（固定在底部）
  const renderMyRank = () => {
    if (!myRank || !myLevel) return null;

    return (
      <View style={styles.myRankSection}>
        <View style={styles.myRankHeader}>
          <Icon name="person" size={16} color="#ff6b6b" />
          <Text style={styles.myRankTitle}>我的排名</Text>
        </View>
        
        <View style={[styles.item, styles.myItem]}>
          <View style={styles.rankContainer}>
            <Text style={styles.rankIcon}>#{myRank}</Text>
          </View>
          
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🦞</Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>我</Text>
            <Text style={styles.userTitle}>{myLevel.title}</Text>
          </View>
          
          <View style={styles.levelInfo}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{myLevel.level}</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${myLevel.progress}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {myLevel.exp}/{myLevel.exp + myLevel.expToNext}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>等级排行榜</Text>
        <Text style={styles.headerCount}>{leaderboard.length}人</Text>
      </View>

      {/* 前三名展示 */}
      {leaderboard.length >= 3 && (
        <View style={styles.topThreeContainer}>
          {leaderboard.slice(0, 3).map((user, index) => (
            <View 
              key={user._id} 
              style={[
                styles.topUser,
                index === 0 && styles.firstPlace,
                index === 1 && styles.secondPlace,
                index === 2 && styles.thirdPlace
              ]}
            >
              <Text style={styles.topMedal}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </Text>
              <Image
                source={{ uri: user.user?.avatar || 'https://via.placeholder.com/100' }}
                style={styles.topAvatar}
              />
              <Text style={styles.topName} numberOfLines={1}>
                {user.user?.nickname}
              </Text>
              <Text style={styles.topLevel}>Lv.{user.level}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 榜单列表 */}
      <FlatList
        data={leaderboard.slice(3)}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        ListFooterComponent={renderMyRank}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
  topThreeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  topUser: {
    flex: 1,
    alignItems: 'center'
  },
  firstPlace: {
    transform: [{ scale: 1.1 }]
  },
  secondPlace: {
    opacity: 0.9
  },
  thirdPlace: {
    opacity: 0.8
  },
  topMedal: {
    fontSize: 32,
    marginBottom: 8
  },
  topAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8
  },
  topName: {
    fontSize: 13,
    color: '#333',
    maxWidth: 80,
    textAlign: 'center'
  },
  topLevel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  topItem: {
    backgroundColor: '#fff9e6'
  },
  rankContainer: {
    width: 40,
    alignItems: 'center'
  },
  rankIcon: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginHorizontal: 12
  },
  avatarText: {
    fontSize: 30,
    textAlign: 'center',
    textAlignVertical: 'center',
    height: 50
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333'
  },
  topUserName: {
    color: '#ff6b6b'
  },
  userTitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  levelInfo: {
    alignItems: 'flex-end'
  },
  levelBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  expText: {
    fontSize: 11,
    color: '#999'
  },
  myRankSection: {
    marginTop: 16
  },
  myRankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4
  },
  myRankTitle: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginLeft: 4
  },
  myItem: {
    backgroundColor: '#ffebee',
    borderWidth: 2,
    borderColor: '#ff6b6b'
  },
  progressContainer: {
    width: 100,
    marginTop: 4
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6b6b',
    borderRadius: 2
  },
  progressText: {
    fontSize: 9,
    color: '#999',
    textAlign: 'right',
    marginTop: 2
  }
});
