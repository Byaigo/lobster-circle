/**
 * Socket.io 客户端服务
 */

import io from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // 连接 Socket
  connect(userId) {
    if (this.socket && this.connected) {
      console.log('Socket 已连接');
      return;
    }

    this.userId = userId;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      auth: {
        userId
      }
    });

    // 连接成功
    this.socket.on('connect', () => {
      console.log('Socket 连接成功');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // 认证
      this.socket.emit('authenticate', { userId });
    });

    // 认证成功
    this.socket.on('authenticated', (data) => {
      console.log('Socket 认证成功', data);
    });

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      console.log('Socket 断开:', reason);
      this.connected = false;
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('Socket 连接错误:', error);
      this.connected = false;
      this.reconnectAttempts++;
    });

    // 接收通知
    this.socket.on('notification', (notification) => {
      console.log('收到通知:', notification);
      this.handleNotification(notification);
    });

    // 用户在线状态
    this.socket.on('user_status', (data) => {
      console.log('用户状态更新:', data);
      this.handleUserStatus(data);
    });

    // 错误处理
    this.socket.on('error', (error) => {
      console.error('Socket 错误:', error);
    });
  }

  // 处理通知
  handleNotification(notification) {
    // 这里可以触发 Redux/Context 更新
    console.log('处理通知:', notification);
    
    // 存储通知到本地
    this.saveNotification(notification);
  }

  // 处理用户状态
  handleUserStatus(data) {
    console.log('处理用户状态:', data);
  }

  // 保存通知到本地
  async saveNotification(notification) {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      const list = notifications ? JSON.parse(notifications) : [];
      list.unshift({
        ...notification,
        receivedAt: Date.now(),
        read: false
      });
      
      // 只保留最近 50 条
      if (list.length > 50) {
        list.splice(50);
      }
      
      await AsyncStorage.setItem('notifications', JSON.stringify(list));
    } catch (error) {
      console.error('保存通知失败:', error);
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.userId = null;
    }
  }

  // 获取连接状态
  isConnected() {
    return this.connected && this.socket !== null;
  }

  // 获取用户 ID
  getUserId() {
    return this.userId;
  }
}

// 单例模式
const socketService = new SocketService();

export default socketService;
