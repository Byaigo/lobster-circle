/**
 * 🦞 龙虾圈 Socket.io 客户端
 * 处理实时消息推送
 */

import io from 'socket.io-client';
import { SOCKET_URL } from './config';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  // 连接 Socket
  connect(userId) {
    if (this.socket && this.connected) {
      console.log('Socket 已连接');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Socket 连接成功');
      this.connected = true;
      
      // 通知服务器用户上线
      if (userId) {
        this.socket.emit('user_online', userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket 断开连接');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket 连接错误:', error);
      this.connected = false;
    });

    return this.socket;
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // 发送消息
  sendMessage(from, to, content, type = 'text') {
    if (!this.socket || !this.connected) {
      console.error('Socket 未连接');
      return false;
    }

    this.socket.emit('send_message', { from, to, content, type });
    return true;
  }

  // 监听新消息
  onNewMessage(callback) {
    if (!this.socket) return;
    this.socket.on('new_message', callback);
  }

  // 监听消息已读回执
  onMessageRead(callback) {
    if (!this.socket) return;
    this.socket.on('message_read_receipt', callback);
  }

  // 监听消息发送成功
  onMessageSent(callback) {
    if (!this.socket) return;
    this.socket.on('message_sent', callback);
  }

  // 监听用户在线状态
  onUserStatus(callback) {
    if (!this.socket) return;
    this.socket.on('user_status', callback);
  }

  // 标记消息已读
  markAsRead(messageId, from, to) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('message_read', { messageId, from, to });
  }

  // 移除监听
  removeListener(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  // 移除所有监听
  removeAllListeners() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }
}

// 单例模式
const socketService = new SocketService();

export default socketService;
