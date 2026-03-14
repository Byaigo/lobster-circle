/**
 * 幸运抽奖页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

export default function LotteryScreen() {
  const navigation = useNavigation();
  
  const [lottery, setLottery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [records, setRecords] = useState([]);

  // 加载抽奖活动
  useEffect(() => {
    loadLottery();
    loadRecords();
  }, []);

  const loadLottery = async () => {
    try {
      const response = await api.get('/lottery');
      if (response.data.data.length > 0) {
        setLottery(response.data.data[0]);
      }
    } catch (error) {
      console.error('加载抽奖活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      const response = await api.get('/lottery/records', {
        params: { page: 1, limit: 10 }
      });
      setRecords(response.data.data);
    } catch (error) {
      console.error('加载记录失败:', error);
    }
  };

  // 抽奖
  const draw = async (isFree = false) => {
    if (!lottery) return;

    setDrawing(true);
    try {
      const response = await api.post(`/lottery/${lottery._id}/draw`, { isFree });
      setResult(response.data.data.prize);
      setShowResult(true);
      loadRecords();
      loadLottery(); // 刷新剩余次数
      
      Alert.alert('🎉 恭喜', `获得：${response.data.data.prize.name}`);
    } catch (error) {
      Alert.alert('错误', error.response?.data?.error || '抽奖失败');
    } finally {
      setDrawing(false);
    }
  };

  // 渲染奖品
  const renderPrize = (prize, index) => (
    <View
      key={index}
      style={[
        styles.prizeItem,
        result?._id === prize._id && styles.selectedPrize
      ]}
    >
      <Text style={styles.prizeIcon}>{prize.icon}</Text>
      <Text style={styles.prizeName} numberOfLines={1}>{prize.name}</Text>
      <View style={[
        styles.rarityBadge,
        styles[`rarity${prize.rarity}`]
      ]}>
        <Text style={styles.rarityText}>
          {prize.rarity === 'common' ? '普通' :
           prize.rarity === 'uncommon' ? '少见' :
           prize.rarity === 'rare' ? '稀有' :
           prize.rarity === 'epic' ? '史诗' : '传说'}
        </Text>
      </View>
    </View>
  );

  // 渲染记录
  const renderRecord = ({ item }) => (
    <View style={styles.recordItem}>
      <Text style={styles.recordIcon}>{item.prize.icon}</Text>
      <View style={styles.recordInfo}>
        <Text style={styles.recordName}>{item.prize.name}</Text>
        <Text style={styles.recordTime}>
          {new Date(item.drawnAt).toLocaleString('zh-CN')}
        </Text>
      </View>
      {item.isFree && (
        <View style={styles.freeBadge}>
          <Text style={styles.freeText}>免费</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  if (!lottery) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="gift-outline" size={80} color="#ddd" />
        <Text style={styles.emptyText}>暂无抽奖活动</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部横幅 */}
      <View style={styles.banner}>
        <Image
          source={{ uri: lottery.banner }}
          style={styles.bannerImage}
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>{lottery.name}</Text>
          <Text style={styles.bannerDesc}>{lottery.description}</Text>
        </View>
      </View>

      {/* 抽奖区域 */}
      <View style={styles.drawSection}>
        <Text style={styles.sectionTitle}>奖池</Text>
        <FlatList
          data={lottery.prizes}
          renderItem={({ item, index }) => renderPrize(item, index)}
          keyExtractor={(item, index) => index.toString()}
          numColumns={4}
          scrollEnabled={false}
          contentContainerStyle={styles.prizeGrid}
        />
      </View>

      {/* 抽奖按钮 */}
      <View style={styles.drawButtons}>
        <TouchableOpacity
          style={[styles.drawButton, styles.freeButton]}
          onPress={() => draw(true)}
          disabled={drawing || lottery.freeDrawsRemaining <= 0}
        >
          <Text style={styles.drawButtonText}>
            {lottery.freeDrawsRemaining > 0
              ? `免费抽奖 (${lottery.freeDrawsRemaining}次)`
              : '免费次数已用完'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.drawButton, styles.payButton]}
          onPress={() => draw(false)}
          disabled={drawing}
        >
          <Text style={styles.drawButtonText}>
            消耗{lottery.cost}积分抽奖
          </Text>
        </TouchableOpacity>
      </View>

      {/* 抽奖记录 */}
      <View style={styles.recordsSection}>
        <Text style={styles.sectionTitle}>我的记录</Text>
        <FlatList
          data={records}
          renderItem={renderRecord}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* 结果弹窗 */}
      <Modal
        visible={showResult}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResult(false)}
      >
        <View style={styles.resultOverlay}>
          <View style={styles.resultModal}>
            <Text style={styles.resultTitle}>🎉 恭喜获得</Text>
            {result && (
              <>
                <Text style={styles.resultIcon}>{result.icon}</Text>
                <Text style={styles.resultName}>{result.name}</Text>
                <View style={[
                  styles.resultRarity,
                  styles[`rarity${result.rarity}`]
                ]}>
                  <Text style={styles.rarityText}>
                    {result.rarity === 'legendary' ? '传说' :
                     result.rarity === 'epic' ? '史诗' :
                     result.rarity === 'rare' ? '稀有' :
                     result.rarity === 'uncommon' ? '少见' : '普通'}
                  </Text>
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowResult(false)}
            >
              <Text style={styles.closeButtonText}>开心收下</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999'
  },
  banner: {
    height: 150,
    position: 'relative'
  },
  bannerImage: {
    width: '100%',
    height: '100%'
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  bannerDesc: {
    fontSize: 14,
    color: '#fff'
  },
  drawSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  prizeGrid: {
    paddingHorizontal: 8
  },
  prizeItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedPrize: {
    backgroundColor: '#ffebee',
    borderWidth: 2,
    borderColor: '#ff6b6b'
  },
  prizeIcon: {
    fontSize: 32,
    marginBottom: 4
  },
  prizeName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center'
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4
  },
  raritycommon: { backgroundColor: '#e0e0e0' },
  rarityuncommon: { backgroundColor: '#c8e6c9' },
  rarityrare: { backgroundColor: '#90caf9' },
  rarityepic: { backgroundColor: '#ce93d8' },
  raritylegendary: { backgroundColor: '#ffd700' },
  rarityText: {
    fontSize: 10,
    color: '#666'
  },
  drawButtons: {
    flexDirection: 'row',
    padding: 16
  },
  drawButton: {
    flex: 1,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 4
  },
  freeButton: {
    backgroundColor: '#4caf50'
  },
  payButton: {
    backgroundColor: '#ff6b6b'
  },
  drawButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  recordsSection: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  recordIcon: {
    fontSize: 32,
    marginRight: 12
  },
  recordInfo: {
    flex: 1
  },
  recordName: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2
  },
  recordTime: {
    fontSize: 12,
    color: '#999'
  },
  freeBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  freeText: {
    fontSize: 11,
    color: '#4caf50'
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  resultModal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center'
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24
  },
  resultIcon: {
    fontSize: 80,
    marginBottom: 16
  },
  resultName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  resultRarity: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24
  },
  closeButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
