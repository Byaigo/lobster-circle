/**
 * 用户反馈页面
 */

import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FeedbackScreen({ darkMode, navigation }) {
  const [type, setType] = useState('suggestion');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);

  const typeOptions = [
    { value: 'bug', label: '🐛 Bug 反馈', placeholder: '请描述遇到的问题...' },
    { value: 'suggestion', label: '💡 功能建议', placeholder: '请描述您的建议...' },
    { value: 'complaint', label: '😤 投诉建议', placeholder: '请描述您的问题...' },
    { value: 'other', label: '📝 其他', placeholder: '请描述...' },
  ];

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请填写反馈内容');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, content, contact }),
      });

      const data = await response.json();

      if (data.feedback) {
        Alert.alert('提交成功', '感谢您的反馈，我们会尽快处理！');
        setContent('');
        setContact('');
        loadMyFeedbacks();
      } else {
        Alert.alert('错误', data.error || '提交失败');
      }
    } catch (error) {
      Alert.alert('错误', '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMyFeedbacks = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/feedback/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMyFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error('加载反馈失败:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      processing: '#2196f3',
      resolved: '#4caf50',
      rejected: '#f44336',
    };
    return colors[status] || '#999';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      rejected: '已拒绝',
    };
    return texts[status] || status;
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, darkMode && styles.textDark]}>📝 用户反馈</Text>
          <Text style={[styles.subtitle, darkMode && styles.textMuted]}>
            有任何问题或建议？告诉我们！
          </Text>
        </View>

        {/* 反馈类型 */}
        <View style={[styles.section, darkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>反馈类型</Text>
          <View style={styles.typeGrid}>
            {typeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeOption,
                  type === option.value && styles.typeOptionSelected,
                  darkMode && styles.typeOptionDark,
                ]}
                onPress={() => setType(option.value)}
              >
                <Text style={styles.typeOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 反馈内容 */}
        <View style={[styles.section, darkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>反馈内容</Text>
          <TextInput
            style={[styles.textArea, darkMode && styles.inputDark]}
            placeholder={typeOptions.find((o) => o.value === type)?.placeholder || '请描述...'}
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
          />
        </View>

        {/* 联系方式（可选） */}
        <View style={[styles.section, darkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>
            联系方式 <Text style={styles.optional}>（可选）</Text>
          </Text>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark]}
            placeholder="微信/QQ/手机号"
            placeholderTextColor="#999"
            value={contact}
            onChangeText={setContact}
          />
        </View>

        {/* 提交按钮 */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>🚀 提交反馈</Text>
          )}
        </TouchableOpacity>

        {/* 我的反馈 */}
        {myFeedbacks.length > 0 && (
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>我的反馈</Text>
            {myFeedbacks.map((feedback) => (
              <View key={feedback._id} style={[styles.feedbackItem, darkMode && styles.feedbackItemDark]}>
                <View style={styles.feedbackHeader}>
                  <Text style={[styles.feedbackType, darkMode && styles.textDark]}>
                    {typeOptions.find((o) => o.value === feedback.type)?.label || feedback.type}
                  </Text>
                  <Text
                    style={[
                      styles.feedbackStatus,
                      { color: getStatusColor(feedback.status) },
                    ]}
                  >
                    {getStatusText(feedback.status)}
                  </Text>
                </View>
                <Text style={[styles.feedbackContent, darkMode && styles.textMuted]} numberOfLines={2}>
                  {feedback.content}
                </Text>
                {feedback.reply && (
                  <View style={styles.replyBox}>
                    <Text style={[styles.replyLabel, darkMode && styles.textDark]}>官方回复：</Text>
                    <Text style={[styles.replyContent, darkMode && styles.textMuted]}>{feedback.reply}</Text>
                  </View>
                )}
                <Text style={[styles.feedbackTime, darkMode && styles.textMuted]}>
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { flex: 1, backgroundColor: '#0f0f1a' },
  textDark: { color: '#fff' },
  textMuted: { color: '#888' },
  inputDark: { backgroundColor: '#1a1a2e', color: '#fff', borderColor: '#333' },
  scrollView: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 5 },
  section: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10 },
  sectionDark: { backgroundColor: '#1a1a2e' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  optional: { fontSize: 12, color: '#999', fontWeight: 'normal' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  typeOptionDark: { backgroundColor: '#0f0f1a' },
  typeOptionSelected: { backgroundColor: '#00ff88' },
  typeOptionText: { fontSize: 14 },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  submitButton: {
    margin: 15,
    padding: 15,
    backgroundColor: '#00ff88',
    borderRadius: 30,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  feedbackItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  feedbackItemDark: { backgroundColor: '#0f0f1a' },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  feedbackType: { fontSize: 14, fontWeight: 'bold' },
  feedbackStatus: { fontSize: 12, fontWeight: 'bold' },
  feedbackContent: { fontSize: 14, marginBottom: 8 },
  replyBox: {
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    marginBottom: 8,
  },
  replyLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  replyContent: { fontSize: 13 },
  feedbackTime: { fontSize: 12, textAlign: 'right' },
});
