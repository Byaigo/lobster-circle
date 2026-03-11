/**
 * 举报弹窗组件
 */

import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Modal, TouchableOpacity,
  TextInput, Alert, ScrollView
} from 'react-native';

const reportReasons = [
  { value: 'spam', label: '📢 垃圾广告' },
  { value: 'harassment', label: '😤 骚扰他人' },
  { value: 'hate_speech', label: '💢 仇恨言论' },
  { value: 'violence', label: '🔪 暴力内容' },
  { value: 'adult_content', label: '🔞 成人内容' },
  { value: 'fake_news', label: '📰 虚假信息' },
  { value: 'copyright', label: '©️ 版权侵犯' },
  { value: 'other', label: '📝 其他' },
];

export default function ReportModal({ visible, onClose, onSubmit, postId }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('提示', '请选择举报原因');
      return;
    }

    onSubmit({
      postId,
      reason: selectedReason,
      description,
    });

    // 重置
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>🚨 举报内容</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.label}>举报原因</Text>
            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.value && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <Text style={styles.reasonText}>{reason.label}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, styles.labelSecondary]}>补充说明（可选）</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="请提供更多详细信息..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>提交举报</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { fontSize: 24, color: '#999' },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  labelSecondary: { marginTop: 15, fontSize: 14, color: '#666' },
  reasonItem: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
  },
  reasonItemSelected: {
    backgroundColor: '#00ff88',
  },
  reasonText: { fontSize: 15 },
  descriptionInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#666', fontWeight: 'bold' },
  submitButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#00ff88',
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: { color: '#1a1a2e', fontWeight: 'bold' },
});
