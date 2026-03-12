/**
 * 签到页面
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckInScreen({ darkMode, navigation }) {
  const [checkInStatus, setCheckInStatus] = useState({
    checkedInToday: false,
    streak: 0,
    points: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckInStatus();
  }, []);

  const loadCheckInStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/checkin/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCheckInStatus(data);
    } catch (error) {
      console.error('加载签到状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/checkin/do`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert('签到成功', `获得 ${data.points} 积分，连续签到 ${data.continuousDays} 天！`);
        loadCheckInStatus();
      } else {
        Alert.alert('提示', data.error || '签到失败');
      }
    } catch (error) {
      Alert.alert('错误', '签到失败');
    }
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
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.textDark]}>📅 每日签到</Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.streakLabel, darkMode && styles.textDark]}>连续签到</Text>
        <Text style={styles.streakNumber}>{checkInStatus.streak}</Text>
        <Text style={[styles.streakUnit, darkMode && styles.textMuted]}>天</Text>
      </View>

      <View style={styles.pointsCard}>
        <Text style={[styles.pointsLabel, darkMode && styles.textDark]}>当前积分</Text>
        <Text style={styles.pointsNumber}>{checkInStatus.points}</Text>
      </View>

      {checkInStatus.checkedInToday ? (
        <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled>
          <Text style={styles.buttonText}>✅ 今日已签到</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleCheckIn}>
          <Text style={styles.buttonText}>🎁 立即签到</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.historyButton}
        onPress={() => navigation.navigate('CheckInHistory')}
      >
        <Text style={styles.historyButtonText}>📊 查看签到记录</Text>
      </TouchableOpacity>

      <View style={styles.rules}>
        <Text style={[styles.rulesTitle, darkMode && styles.textDark]}>📋 签到规则</Text>
        <Text style={[styles.ruleItem, darkMode && styles.textMuted]}>• 每日签到可获得 10-50 积分</Text>
        <Text style={[styles.ruleItem, darkMode && styles.textMuted]}>• 连续 7 天奖励 20 分</Text>
        <Text style={[styles.ruleItem, darkMode && styles.textMuted]}>• 连续 14 天奖励 30 分</Text>
        <Text style={[styles.ruleItem, darkMode && styles.textMuted]}>• 连续 30 天奖励 50 分</Text>
        <Text style={[styles.ruleItem, darkMode && styles.textMuted]}>• 积分可用于兑换礼品</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { flex: 1, backgroundColor: '#0f0f1a' },
  textDark: { color: '#fff' },
  textMuted: { color: '#888' },
  loadingText: { fontSize: 16, textAlign: 'center', marginTop: 50 },
  header: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  card: { margin: 20, padding: 40, backgroundColor: '#fff', borderRadius: 15, alignItems: 'center' },
  streakLabel: { fontSize: 16, color: '#666' },
  streakNumber: { fontSize: 72, fontWeight: 'bold', color: '#00ff88', marginVertical: 10 },
  streakUnit: { fontSize: 16, color: '#666' },
  pointsCard: { margin: 20, padding: 20, backgroundColor: '#fff', borderRadius: 15, alignItems: 'center' },
  pointsLabel: { fontSize: 16, color: '#666' },
  pointsNumber: { fontSize: 36, fontWeight: 'bold', color: '#00ff88', marginTop: 10 },
  button: { margin: 20, padding: 15, backgroundColor: '#00ff88', borderRadius: 30, alignItems: 'center' },
  buttonDisabled: { margin: 20, padding: 15, backgroundColor: '#ccc', borderRadius: 30, alignItems: 'center' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  rules: { margin: 20, padding: 20, backgroundColor: '#fff', borderRadius: 15 },
  rulesTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  ruleItem: { fontSize: 14, marginVertical: 5 },
  historyButton: { margin: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 15, alignItems: 'center' },
  historyButtonText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
});
