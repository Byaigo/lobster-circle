/**
 * 消息气泡组件 - 支持撤回/删除
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MessageItem({ message, currentUser, onRecall, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  
  const isMe = message.from._id === currentUser.id;
  const isRecalled = message.isRecalled;

  const handleLongPress = () => {
    if (isMe && !isRecalled) {
      setShowActions(true);
    }
  };

  const handleRecall = async () => {
    Alert.alert(
      '撤回消息',
      '确定要撤回这条消息吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '撤回',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`${API_BASE_URL}/messages/${message._id}/recall`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (onRecall) {
                onRecall(message._id);
              }
              setShowActions(false);
            } catch (error) {
              Alert.alert('错误', '撤回失败');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      '删除消息',
      '确定要删除这条消息吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`${API_BASE_URL}/messages/${message._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (onDelete) {
                onDelete(message._id);
              }
              setShowActions(false);
            } catch (error) {
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  if (isRecalled) {
    return (
      <View style={styles.recalledContainer}>
        <Text style={styles.recalledText}>消息已撤回</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isMe ? styles.containerMe : styles.containerOther,
      ]}
      onLongPress={handleLongPress}
    >
      {message.type === 'image' && message.imageUrl ? (
        <Image source={{ uri: message.imageUrl }} style={styles.image} />
      ) : (
        <Text style={[styles.text, isMe && styles.textMe]}>
          {message.content}
        </Text>
      )}
      
      <Text style={[styles.time, isMe && styles.timeMe]}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRecall}>
            <Text style={styles.actionText}>撤回</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Text style={styles.actionText}>删除</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  containerMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#00ff88',
  },
  containerOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 15,
    color: '#333',
  },
  textMe: {
    color: '#1a1a2e',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  time: {
    fontSize: 11,
    color: '#999',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(26,26,46,0.6)',
  },
  recalledContainer: {
    alignItems: 'center',
    padding: 10,
  },
  recalledText: {
    fontSize: 13,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 5,
    marginRight: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
});
