/**
 * 发布视频动态页面
 * 
 * 功能：
 * - 选择/录制视频
 * - 视频预览
 * - 添加文字描述
 * - 设置可见范围
 * - 发布视频动态
 */

import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { postAPI, uploadAPI } from '../api';
import videoService from '../services/videoService';

export default function VideoPostScreen({ navigation, darkMode }) {
  const [video, setVideo] = useState(null);
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef(null);

  // 选择视频
  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]) {
        const selectedVideo = result.assets[0];
        
        // 验证视频
        const validation = videoService.validateVideo({
          uri: selectedVideo.uri,
          size: selectedVideo.fileSize,
          duration: selectedVideo.duration,
          type: selectedVideo.mimeType,
        });

        if (!validation.valid) {
          Alert.alert('验证失败', validation.errors.join('\n'));
          return;
        }

        setVideo({
          uri: selectedVideo.uri,
          name: selectedVideo.fileName || `video_${Date.now()}.mp4`,
          type: selectedVideo.mimeType || 'video/mp4',
          size: selectedVideo.fileSize,
          duration: selectedVideo.duration,
        });
      }
    } catch (error) {
      Alert.alert('选择失败', error.message);
    }
  };

  // 录制视频
  const handleRecordVideo = async () => {
    Alert.alert('录制功能', '请使用系统相机录制后选择视频');
  };

  // 上传并发布
  const handlePublish = async () => {
    if (!video) {
      Alert.alert('提示', '请先选择视频');
      return;
    }

    if (!description.trim()) {
      Alert.alert('提示', '请添加视频描述');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // 1. 上传视频
      setUploadProgress(20);
      const uploadResult = await uploadAPI.uploadVideo(video.uri);
      
      setUploadProgress(60);

      // 2. 发布动态
      const videoData = {
        url: uploadResult.url,
        publicId: uploadResult.key,
        duration: video.duration,
        thumbnail: uploadResult.thumbnail,
        size: uploadResult.size,
      };

      await postAPI.createWithVideo(description, [videoData], visibility);

      setUploadProgress(100);
      
      Alert.alert('发布成功', '视频动态已发布！', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('发布失败:', error);
      Alert.alert('发布失败', error.message || '请稍后重试');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.headerButton, darkMode && styles.textDark]}>取消</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>发布视频</Text>
        <TouchableOpacity onPress={handlePublish} disabled={loading}>
          <Text style={[
            styles.headerButton,
            darkMode && styles.textDark,
            loading && styles.disabled
          ]}>
            发布
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 视频预览 */}
        {video ? (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: video.uri }}
              useNativeControls
              resizeMode="cover"
              isLooping
            />
            <TouchableOpacity
              style={styles.removeVideo}
              onPress={() => setVideo(null)}
            >
              <Text style={styles.removeVideoText}>✕</Text>
            </TouchableOpacity>
            
            {/* 视频信息 */}
            <View style={styles.videoInfo}>
              <Text style={styles.videoInfoText}>
                {videoService.formatDuration(video.duration)} · {videoService.formatFileSize(video.size)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyVideo, darkMode && styles.emptyVideoDark]}>
            <TouchableOpacity onPress={handlePickVideo} style={styles.selectButton}>
              <Text style={styles.selectButtonText}>📹 选择视频</Text>
            </TouchableOpacity>
            <Text style={[styles.hintText, darkMode && styles.textMuted]}>
              支持 mp4、mov 格式，最大 100MB，最长 60 秒
            </Text>
          </View>
        )}

        {/* 描述输入 */}
        <View style={[styles.inputContainer, darkMode && styles.inputContainerDark]}>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark]}
            placeholder="添加视频描述..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            value={description}
            onChangeText={setDescription}
          />
          <Text style={[styles.charCount, darkMode && styles.textMuted]}>
            {description.length}/1000
          </Text>
        </View>

        {/* 可见范围 */}
        <View style={[styles.section, darkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>可见范围</Text>
          <View style={styles.visibilityOptions}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                visibility === 'public' && styles.visibilityOptionActive,
                darkMode && styles.visibilityOptionDark,
              ]}
              onPress={() => setVisibility('public')}
            >
              <Text style={styles.visibilityEmoji}>🌍</Text>
              <Text style={[
                styles.visibilityLabel,
                visibility === 'public' && styles.visibilityLabelActive,
                darkMode && styles.textDark,
              ]}>公开</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                visibility === 'friends' && styles.visibilityOptionActive,
                darkMode && styles.visibilityOptionDark,
              ]}
              onPress={() => setVisibility('friends')}
            >
              <Text style={styles.visibilityEmoji}>👥</Text>
              <Text style={[
                styles.visibilityLabel,
                visibility === 'friends' && styles.visibilityLabelActive,
                darkMode && styles.textDark,
              ]}>好友可见</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                visibility === 'private' && styles.visibilityOptionActive,
                darkMode && styles.visibilityOptionDark,
              ]}
              onPress={() => setVisibility('private')}
            >
              <Text style={styles.visibilityEmoji}>🔒</Text>
              <Text style={[
                styles.visibilityLabel,
                visibility === 'private' && styles.visibilityLabelActive,
                darkMode && styles.textDark,
              ]}>私密</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 加载遮罩 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>
            上传中... {uploadProgress}%
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#0f0f1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerDark: {
    backgroundColor: '#1a1a2e',
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  headerButton: {
    fontSize: 16,
    color: '#00ff88',
    paddingHorizontal: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
  videoContainer: {
    marginBottom: 15,
  },
  video: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#000',
  },
  removeVideo: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeVideoText: {
    color: '#fff',
    fontSize: 18,
  },
  videoInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  videoInfoText: {
    color: '#666',
    fontSize: 13,
  },
  emptyVideo: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
  },
  emptyVideoDark: {
    backgroundColor: '#1a1a2e',
  },
  selectButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 10,
  },
  selectButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  inputContainerDark: {
    backgroundColor: '#1a1a2e',
  },
  input: {
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  inputDark: {
    color: '#fff',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  sectionDark: {
    backgroundColor: '#1a1a2e',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 15,
  },
  visibilityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  visibilityOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    minWidth: 80,
  },
  visibilityOptionDark: {
    backgroundColor: '#0f0f1a',
  },
  visibilityOptionActive: {
    backgroundColor: '#e6fff5',
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  visibilityEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  visibilityLabel: {
    fontSize: 14,
    color: '#666',
  },
  visibilityLabelActive: {
    color: '#00ff88',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  textDark: {
    color: '#fff',
  },
  textMuted: {
    color: '#666',
  },
});
