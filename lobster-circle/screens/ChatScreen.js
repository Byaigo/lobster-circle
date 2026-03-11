/**
 * 🦞 私信聊天页面
 * 功能：实时聊天、发送消息、已读回执
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  SafeAreaView, FlatList, KeyboardAvoidingView, Platform,
  Modal, Alert
} from 'react-native';
import { messageAPI } from '../api';
import socketService from '../socket';

export default function ChatScreen({ route, currentUser, darkMode }) {
  const { userId, username, avatar } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    // 连接 Socket
    socketService.connect(currentUser.id);
    
    // 监听新消息
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageSent(handleMessageSent);
    
    // 用户上线通知
    socketService.emit('user_online', currentUser.id);

    return () => {
      socketService.removeListener('new_message', handleNewMessage);
      socketService.removeListener('message_sent', handleMessageSent);
    };
  }, []);

  useEffect(() => {
    // 滚动到底部
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messageAPI.getConversation(userId);
      setMessages(data.messages || []);
      
      // 标记为已读
      await messageAPI.markAsRead(getConversationId());
    } catch (error) {
      console.error('加载消息失败:', error);
      Alert.alert('错误', '加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  const getConversationId = () => {
    return [currentUser.id, userId].sort().join('_');
  };

  const handleNewMessage = (data) => {
    // 检查是否是当前对话的消息
    if ((data.from === userId && data.to === currentUser.id) ||
        (data.from === currentUser.id && data.to === userId)) {
      setMessages(prev => [...prev, {
        _id: Date.now().toString(),
        from: { _id: data.from },
        to: { _id: data.to },
        content: data.content,
        type: data.type,
        createdAt: data.timestamp
      }]);
    }
  };

  const handleMessageSent = (data) => {
    console.log('消息发送成功:', data);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const tempMessage = {
      _id: Date.now().toString(),
      from: { _id: currentUser.id },
      to: { _id: userId },
      content: inputText,
      type: 'text',
      createdAt: new Date().toISOString(),
      pending: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setInputText('');

    try {
      // 通过 Socket 发送
      const sent = socketService.sendMessage(currentUser.id, userId, inputText, 'text');
      
      if (!sent) {
        // Socket 未连接，使用 REST API
        await messageAPI.send(userId, inputText, 'text');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      Alert.alert('错误', '发送失败，请检查网络连接');
      // 移除临时消息
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
    }
  };

  const renderMessage = ({ item, index }) => {
    const isFromMe = item.from._id === currentUser.id;
    const showAvatar = index === 0 || messages[index - 1]?.from._id !== item.from._id;

    return (
      <View style={[
        styles.messageContainer,
        isFromMe ? styles.messageContainerMe : styles.messageContainerOther,
        !showAvatar && styles.messageContainerNoAvatar
      ]}>
        {!isFromMe && showAvatar && (
          <Text style={styles.messageAvatar}>{avatar || '😎'}</Text>
        )}
        {!isFromMe && !showAvatar && <View style={styles.messageAvatarPlaceholder} />)}
        
        <View style={[
          styles.messageBubble,
          isFromMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          darkMode && (isFromMe ? styles.messageBubbleMeDark : styles.messageBubbleOtherDark)
        ]}>
          <Text style={[styles.messageText, isFromMe && styles.messageTextMe, darkMode && styles.messageTextDark]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isFromMe && styles.messageTimeMe]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {item.read && isFromMe && ' ✓✓'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* 聊天头部 */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <View style={styles.headerUser}>
          <Text style={styles.headerAvatar}>{avatar || '😎'}</Text>
          <View>
            <Text style={[styles.headerUsername, darkMode && styles.textDark]}>{username}</Text>
            <Text style={styles.headerStatus}>🟢 在线</Text>
          </View>
        </View>
      </View>

      {/* 消息列表 */}
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item._id || item.id}
          contentContainerStyle={styles.messageList}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={[styles.emptyText, darkMode && styles.textDark]}>
                还没有消息
              </Text>
              <Text style={[styles.emptySubtext, darkMode && styles.textMuted]}>
                发送一条消息开始聊天吧～
              </Text>
            </View>
          }
        />

        {/* 输入框 */}
        <View style={[styles.inputContainer, darkMode && styles.inputContainerDark]}>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark]}
            placeholder="输入消息..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { flex: 1, backgroundColor: '#0f0f1a' },
  textDark: { color: '#fff' },
  textMuted: { color: '#888' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerDark: { backgroundColor: '#1a1a2e', borderBottomColor: '#333' },
  headerUser: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { fontSize: 32, marginRight: 10 },
  headerUsername: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  headerStatus: { fontSize: 12, color: '#00ff88' },
  keyboardView: { flex: 1 },
  messageList: { padding: 10 },
  messageContainer: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  messageContainerMe: { justifyContent: 'flex-end' },
  messageContainerOther: { justifyContent: 'flex-start' },
  messageContainerNoAvatar: { marginLeft: 50 },
  messageAvatar: { fontSize: 32, marginRight: 8, marginBottom: 5 },
  messageAvatarPlaceholder: { width: 40, marginRight: 8 },
  messageBubble: { maxWidth: '70%', padding: 12, borderRadius: 18 },
  messageBubbleMe: { backgroundColor: '#00ff88', borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  messageBubbleMeDark: { backgroundColor: '#00cc6a' },
  messageBubbleOtherDark: { backgroundColor: '#1a1a2e' },
  messageText: { fontSize: 15, color: '#1a1a2e' },
  messageTextMe: { color: '#1a1a2e' },
  messageTextDark: { color: '#fff' },
  messageTime: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' },
  messageTimeMe: { color: '#006633' },
  emptyChat: { alignItems: 'center', padding: 50 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#999' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  inputContainerDark: { backgroundColor: '#1a1a2e', borderTopColor: '#333' },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  inputDark: { backgroundColor: '#0f0f1a', color: '#fff' },
  sendButton: { marginLeft: 10, backgroundColor: '#00ff88', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: '#ccc' },
  sendButtonText: { fontSize: 20 }
});
