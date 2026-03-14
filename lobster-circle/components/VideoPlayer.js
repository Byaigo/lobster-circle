/**
 * 视频播放器组件
 * 
 * 功能：
 * - 视频播放/暂停
 * - 进度条控制
 * - 全屏切换
 * - 播放速度调节
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Slider,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';

export default function VideoPlayer({
  source,
  style,
  useNativeControls = false,
  resizeMode = ResizeMode.CONTAIN,
  shouldPlay = true,
  isLooping = false,
  onPlaybackStatusUpdate,
}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    // 自动隐藏控制条
    if (showControls && !useNativeControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, useNativeControls]);

  const handlePlaybackStatusUpdate = (newStatus) => {
    setStatus(newStatus);
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(newStatus);
    }
  };

  const handleSeek = async (value) => {
    if (videoRef.current) {
      const positionMillis = value * status.durationMillis;
      await videoRef.current.setPositionAsync(positionMillis);
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (status.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.presentFullscreenPlayer();
      setIsFullscreen(true);
    } catch (error) {
      console.error('[VideoPlayer] 全屏失败:', error);
    }
  };

  const formatTime = (millis) => {
    if (!millis) return '0:00';
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (useNativeControls) {
    return (
      <Video
        ref={videoRef}
        style={[styles.video, style]}
        source={source}
        useNativeControls
        resizeMode={resizeMode}
        isLooping={isLooping}
        shouldPlay={shouldPlay}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={source}
        useNativeControls={false}
        resizeMode={resizeMode}
        isLooping={isLooping}
        shouldPlay={shouldPlay}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onTouchStart={() => setShowControls(true)}
      />

      {/* 加载指示器 */}
      {status.isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* 播放/暂停按钮 */}
      {!status.isPlaying && !status.isLoading && (
        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          <Text style={styles.playButtonText}>▶</Text>
        </TouchableOpacity>
      )}

      {/* 控制条 */}
      {showControls && (
        <View style={styles.controls}>
          {/* 进度条 */}
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={
              status.durationMillis > 0
                ? status.positionMillis / status.durationMillis
                : 0
            }
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#00ff88"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="#00ff88"
          />

          {/* 控制按钮 */}
          <View style={styles.controlButtons}>
            <TouchableOpacity onPress={togglePlayPause}>
              <Text style={styles.controlButtonText}>
                {status.isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.timeText}>
              {formatTime(status.positionMillis)} / {formatTime(status.durationMillis)}
            </Text>

            <TouchableOpacity onPress={toggleFullscreen}>
              <Text style={styles.controlButtonText}>⛶</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 错误提示 */}
      {status.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>播放失败</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 60,
    color: 'rgba(255,255,255,0.8)',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});
