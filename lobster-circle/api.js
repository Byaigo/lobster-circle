/**
 * 🦞 龙虾圈 API 客户端
 * 封装所有与后端的交互
 */

import { API_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 获取存储的 Token
const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

// 通用请求方法
const request = async (endpoint, options = {}) => {
  const token = await getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  } catch (error) {
    console.error('API 错误:', error);
    throw error;
  }
};

// ==================== 认证 API ====================
export const authAPI = {
  register: async (username, password) => {
    return await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  login: async (username, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    // 保存 Token
    await AsyncStorage.setItem('token', data.token);
    return data;
  },

  logout: async () => {
    await request('/auth/logout', { method: 'POST' });
    await AsyncStorage.removeItem('token');
  },

  getMe: async () => {
    return await request('/auth/me');
  }
};

// ==================== 用户 API ====================
export const userAPI = {
  search: async (query) => {
    return await request(`/users/search?query=${encodeURIComponent(query)}`);
  },

  getUser: async (userId) => {
    return await request(`/users/${userId}`);
  },

  follow: async (userId) => {
    return await request(`/users/${userId}/follow`, { method: 'POST' });
  },

  block: async (userId) => {
    return await request(`/users/${userId}/block`, { method: 'POST' });
  },

  updateProfile: async (bio, avatar) => {
    return await request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ bio, avatar })
    });
  },

  getRecommendations: async () => {
    return await request('/users/recommendations');
  }
};

// ==================== 动态 API ====================
export const postAPI = {
  getFeed: async (page = 1, limit = 20) => {
    return await request(`/posts/feed?page=${page}&limit=${limit}`);
  },

  getPost: async (postId) => {
    return await request(`/posts/${postId}`);
  },

  create: async (content, images = [], visibility = 'public') => {
    return await request('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, images, visibility })
    });
  },

  like: async (postId) => {
    return await request(`/posts/${postId}/like`, { method: 'POST' });
  },

  favorite: async (postId) => {
    return await request(`/posts/${postId}/favorite`, { method: 'POST' });
  },

  comment: async (postId, text) => {
    return await request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  deleteComment: async (postId, commentId) => {
    return await request(`/posts/${postId}/comment/${commentId}`, {
      method: 'DELETE'
    });
  },

  delete: async (postId) => {
    return await request(`/posts/${postId}`, { method: 'DELETE' });
  },

  getByHashtag: async (tag, page = 1, limit = 20) => {
    return await request(`/posts/hashtag/${tag}?page=${page}&limit=${limit}`);
  },

  getFavorites: async (page = 1, limit = 20) => {
    return await request('/posts/favorites/list', {
      method: 'GET'
    });
  }
};

// ==================== 好友 API ====================
export const friendAPI = {
  sendRequest: async (receiverId, message = '') => {
    return await request('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId, message })
    });
  },

  getReceivedRequests: async () => {
    return await request('/friends/requests/received');
  },

  getSentRequests: async () => {
    return await request('/friends/requests/sent');
  },

  acceptRequest: async (requestId) => {
    return await request(`/friends/requests/${requestId}/accept`, {
      method: 'POST'
    });
  },

  rejectRequest: async (requestId) => {
    return await request(`/friends/requests/${requestId}/reject`, {
      method: 'POST'
    });
  },

  getList: async () => {
    return await request('/friends/list');
  },

  delete: async (friendId) => {
    return await request(`/friends/${friendId}`, { method: 'DELETE' });
  }
};

// ==================== 消息 API ====================
export const messageAPI = {
  getConversations: async () => {
    return await request('/messages/conversations');
  },

  getConversation: async (userId) => {
    return await request(`/messages/conversation/${userId}`);
  },

  send: async (to, content, type = 'text', imageUrl = null) => {
    return await request('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ to, content, type, imageUrl })
    });
  },

  markAsRead: async (conversationId) => {
    return await request('/messages/read', {
      method: 'POST',
      body: JSON.stringify({ conversationId })
    });
  },

  delete: async (messageId) => {
    return await request(`/messages/${messageId}`, { method: 'DELETE' });
  }
};

// ==================== 图片上传 API（七牛云） ====================
export const uploadAPI = {
  // 上传图片（服务器中转模式）
  uploadImage: async (uri) => {
    const token = await getToken();
    const formData = new FormData();
    
    // React Native 图片上传格式
    const file = {
      uri,
      type: 'image/jpeg',
      name: `lobster_${Date.now()}.jpg`
    };
    
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/storage/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '上传失败');
    }

    return data;
  },

  // 批量上传图片
  uploadImages: async (uris) => {
    const token = await getToken();
    const formData = new FormData();
    
    uris.forEach((uri, index) => {
      const file = {
        uri,
        type: 'image/jpeg',
        name: `lobster_${Date.now()}_${index}.jpg`
      };
      formData.append('images', file);
    });

    const response = await fetch(`${API_BASE_URL}/storage/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '上传失败');
    }

    return data;
  },

  // 获取上传凭证（客户端直传七牛云模式）
  getUploadToken: async () => {
    return await request('/storage/upload-token');
  }
};

export default {
  auth: authAPI,
  user: userAPI,
  post: postAPI,
  friend: friendAPI,
  message: messageAPI,
  upload: uploadAPI
};
