/**
 * 视频服务
 * 
 * 功能：
 * - 视频选择/录制
 * - 视频上传（七牛云）
 * - 视频压缩
 * - 视频播放控制
 */

import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { uploadAPI } from '../api';

// 视频配置
const VIDEO_CONFIG = {
  maxSize: 100 * 1024 * 1024, // 最大 100MB
  maxDuration: 60, // 最大 60 秒
  allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
};

/**
 * 选择视频
 */
export async function pickVideo() {
  try {
    // 请求权限
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('需要访问媒体库权限');
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: VIDEO_CONFIG.allowedTypes,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const video = result.assets?.[0] || result;
    
    // 验证文件大小
    if (video.size && video.size > VIDEO_CONFIG.maxSize) {
      throw new Error(`视频文件不能超过 ${VIDEO_CONFIG.maxSize / 1024 / 1024}MB`);
    }

    return {
      uri: video.uri,
      name: video.name || `video_${Date.now()}.mp4`,
      type: video.mimeType || 'video/mp4',
      size: video.size,
      duration: video.duration,
    };
  } catch (error) {
    console.error('[VideoService] 选择视频失败:', error);
    throw error;
  }
}

/**
 * 录制视频
 */
export async function recordVideo(cameraRef) {
  try {
    if (!cameraRef?.current) {
      throw new Error('相机未就绪');
    }

    const result = await cameraRef.current.recordAsync({
      maxDuration: VIDEO_CONFIG.maxDuration,
      quality: '720p',
      videoBitrate: 2 * 1024 * 1024, // 2Mbps
    });

    if (!result || !result.uri) {
      throw new Error('录制失败');
    }

    return {
      uri: result.uri,
      name: `video_${Date.now()}.mp4`,
      type: 'video/mp4',
      duration: result.duration,
    };
  } catch (error) {
    console.error('[VideoService] 录制视频失败:', error);
    throw error;
  }
}

/**
 * 上传视频到七牛云
 */
export async function uploadVideo(video) {
  try {
    console.log('[VideoService] 开始上传视频:', video.name);

    // 使用七牛云上传 API
    const result = await uploadAPI.uploadFile(video.uri, 'video');
    
    console.log('[VideoService] 上传成功:', result.url);

    return {
      url: result.url,
      key: result.key,
      duration: video.duration,
      size: video.size,
      thumbnail: result.thumbnail, // 如果有的话
    };
  } catch (error) {
    console.error('[VideoService] 上传视频失败:', error);
    throw error;
  }
}

/**
 * 压缩视频（可选，使用 FFmpeg）
 * 注意：需要安装 react-native-ffmpeg
 */
export async function compressVideo(videoUri, options = {}) {
  // 如果未安装 FFmpeg，直接返回原视频
  try {
    const { default: FFmpeg } = await import('react-native-ffmpeg');
    
    const outputPath = videoUri.replace('.mp4', '_compressed.mp4');
    
    // 压缩参数
    const bitrate = options.bitrate || '1M';
    const resolution = options.resolution || '720p';
    
    const command = `-i ${videoUri} -b:v ${bitrate} -vf scale=${resolution} ${outputPath}`;
    
    const rc = await FFmpeg.execute(command);
    
    if (rc === 0) {
      console.log('[VideoService] 压缩成功:', outputPath);
      return outputPath;
    } else {
      throw new Error('压缩失败');
    }
  } catch (error) {
    console.log('[VideoService] 未安装 FFmpeg，跳过压缩');
    return videoUri;
  }
}

/**
 * 获取视频缩略图
 */
export async function getVideoThumbnail(videoUri) {
  try {
    // 使用 expo-media-library 或 react-native-video 获取缩略图
    // 这里返回一个占位实现
    return null;
  } catch (error) {
    console.error('[VideoService] 获取缩略图失败:', error);
    return null;
  }
}

/**
 * 验证视频
 */
export function validateVideo(video) {
  const errors = [];

  if (!video.uri) {
    errors.push('视频 URI 不能为空');
  }

  if (video.size && video.size > VIDEO_CONFIG.maxSize) {
    errors.push(`视频文件不能超过 ${VIDEO_CONFIG.maxSize / 1024 / 1024}MB`);
  }

  if (video.duration && video.duration > VIDEO_CONFIG.maxDuration) {
    errors.push(`视频时长不能超过 ${VIDEO_CONFIG.maxDuration}秒`);
  }

  if (video.type && !VIDEO_CONFIG.allowedTypes.includes(video.type)) {
    errors.push('不支持的视频格式');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 格式化视频时长
 */
export function formatDuration(seconds) {
  if (!seconds) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default {
  pickVideo,
  recordVideo,
  uploadVideo,
  compressVideo,
  getVideoThumbnail,
  validateVideo,
  formatDuration,
  formatFileSize,
  VIDEO_CONFIG,
};
