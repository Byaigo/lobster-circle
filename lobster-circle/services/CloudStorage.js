/**
 * 云存储服务（前端集成）
 */

import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class CloudStorageService {
  constructor() {
    this.qiniuDomain = null;
  }

  // 获取上传凭证
  async getUploadToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/storage/upload-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      this.qiniuDomain = data.domain;
      return data.token;
    } catch (error) {
      console.error('获取上传凭证失败:', error);
      return null;
    }
  }

  // 直接上传到七牛云
  async uploadToQiniu(uri, token) {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('file', {
      uri,
      name: `lobster_${Date.now()}.jpg`,
      type: 'image/jpeg',
    });

    const response = await fetch('https://up.qiniup.com', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (result.key) {
      return {
        success: true,
        url: `${this.qiniuDomain}/${result.key}`,
        key: result.key,
      };
    }
    return { success: false, error: result.error };
  }

  // 选择并上传图片
  async pickAndUploadImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return { success: false, error: '需要相册权限' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return { success: false, error: '用户取消选择' };
    }

    const token = await this.getUploadToken();
    if (!token) {
      return { success: false, error: '获取上传凭证失败' };
    }

    return await this.uploadToQiniu(result.assets[0].uri, token);
  }

  // 选择并上传多张图片
  async pickAndUploadImages(maxCount = 9) {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return { success: false, error: '需要相册权限' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) {
      return { success: false, error: '用户取消选择' };
    }

    const token = await this.getUploadToken();
    if (!token) {
      return { success: false, error: '获取上传凭证失败' };
    }

    const uploadPromises = result.assets.slice(0, maxCount).map(asset =>
      this.uploadToQiniu(asset.uri, token)
    );

    const results = await Promise.all(uploadPromises);
    const successResults = results.filter(r => r.success);

    return {
      images: successResults.map(r => ({ url: r.url, key: r.key })),
      count: successResults.length,
      failed: results.length - successResults.length,
    };
  }

  // 通过后端上传（备用方案）
  async uploadViaBackend(uri) {
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: `lobster_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      const response = await fetch(`${API_BASE_URL}/storage/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error('上传失败:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new CloudStorageService();
