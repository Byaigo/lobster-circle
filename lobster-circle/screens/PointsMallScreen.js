/**
 * 积分商城页面
 */

import React, { useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  SafeAreaView, Image, Alert, Modal
} from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 模拟商品数据
const mockProducts = [
  {
    id: '1',
    name: '龙虾圈定制 T 恤',
    points: 500,
    image: 'https://picsum.photos/200/200',
    stock: 100,
    description: '定制款 T 恤，舒适透气',
  },
  {
    id: '2',
    name: '龙虾圈徽章',
    points: 200,
    image: 'https://picsum.photos/200/200',
    stock: 500,
    description: '金属徽章，精美做工',
  },
  {
    id: '3',
    name: '积分抵扣券 10 元',
    points: 1000,
    image: 'https://picsum.photos/200/200',
    stock: 50,
    description: '满 100 元可用',
  },
  {
    id: '4',
    name: '龙虾圈贴纸',
    points: 100,
    image: 'https://picsum.photos/200/200',
    stock: 1000,
    description: '防水贴纸，多款式',
  },
];

export default function PointsMallScreen({ darkMode }) {
  const [userPoints, setUserPoints] = useState(0);
  const [products, setProducts] = useState(mockProducts);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  React.useEffect(() => {
    loadUserPoints();
  }, []);

  const loadUserPoints = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/checkin/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUserPoints(data.points || 0);
    } catch (error) {
      console.error('加载积分失败:', error);
    }
  };

  const handleExchange = async () => {
    if (!selectedProduct) return;

    if (userPoints < selectedProduct.points) {
      Alert.alert('积分不足', '您的积分不足以兑换该商品');
      return;
    }

    Alert.alert(
      '确认兑换',
      `确定要兑换"${selectedProduct.name}"吗？\n需要 ${selectedProduct.points} 积分`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            // 模拟兑换
            setUserPoints(userPoints - selectedProduct.points);
            Alert.alert('兑换成功', '商品将在 3-5 个工作日内发货');
            setExchangeModalVisible(false);
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={[styles.productCard, darkMode && styles.productCardDark]}
      onPress={() => {
        setSelectedProduct(item);
        setExchangeModalVisible(true);
      }}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, darkMode && styles.textDark]}>{item.name}</Text>
        <Text style={[styles.productDesc, darkMode && styles.textMuted]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPoints}>{item.points} 积分</Text>
          <Text style={styles.productStock}>库存：{item.stock}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.textDark]}>🎁 积分商城</Text>
        <View style={styles.pointsBox}>
          <Text style={styles.pointsLabel}>我的积分</Text>
          <Text style={styles.pointsValue}>{userPoints}</Text>
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.productRow}
      />

      {/* 兑换确认弹窗 */}
      <Modal
        visible={exchangeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setExchangeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            {selectedProduct && (
              <>
                <Image source={{ uri: selectedProduct.image }} style={styles.modalImage} />
                <Text style={[styles.modalProductName, darkMode && styles.textDark]}>
                  {selectedProduct.name}
                </Text>
                <Text style={[styles.modalPoints, darkMode && styles.textDark]}>
                  {selectedProduct.points} 积分
                </Text>
                <Text style={[styles.modalDesc, darkMode && styles.textMuted]}>
                  {selectedProduct.description}
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setExchangeModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleExchange}>
                    <Text style={styles.confirmButtonText}>确认兑换</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { flex: 1, backgroundColor: '#0f0f1a' },
  textDark: { color: '#fff' },
  textMuted: { color: '#888' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerDark: { backgroundColor: '#1a1a2e', borderBottomColor: '#333' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  pointsBox: { flexDirection: 'row', alignItems: 'center' },
  pointsLabel: { fontSize: 14, color: '#666', marginRight: 10 },
  pointsValue: { fontSize: 28, fontWeight: 'bold', color: '#00ff88' },
  productList: { padding: 10 },
  productRow: { justifyContent: 'space-between', marginBottom: 10 },
  productCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  productCardDark: { backgroundColor: '#1a1a2e' },
  productImage: { width: '100%', height: 150 },
  productInfo: { padding: 10 },
  productName: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  productDesc: { fontSize: 12, color: '#666', marginBottom: 10 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPoints: { fontSize: 16, fontWeight: 'bold', color: '#00ff88' },
  productStock: { fontSize: 12, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalContentDark: { backgroundColor: '#1a1a2e' },
  modalImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15 },
  modalProductName: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  modalPoints: { fontSize: 24, fontWeight: 'bold', color: '#00ff88', textAlign: 'center', marginBottom: 10 },
  modalDesc: { fontSize: 14, textAlign: 'center', marginBottom: 20, color: '#666' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { flex: 1, padding: 12, backgroundColor: '#eee', borderRadius: 10, marginRight: 10, alignItems: 'center' },
  cancelButtonText: { color: '#666', fontWeight: 'bold' },
  confirmButton: { flex: 1, padding: 12, backgroundColor: '#00ff88', borderRadius: 10, alignItems: 'center' },
  confirmButtonText: { color: '#1a1a2e', fontWeight: 'bold' },
});
