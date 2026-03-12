/**
 * 骨架屏组件
 * 用于加载时的占位显示
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export function SkeletonText({ width = '100%', height = 16, style }) {
  return (
    <View style={[styles.skeleton, { width, height }, style]}>
      <Animated.View style={[styles.shimmer, { width: '50%' }]} />
    </View>
  );
}

export function SkeletonAvatar({ size = 40, style }) {
  return (
    <View style={[styles.skeleton, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Animated.View style={[styles.shimmer, { width: '50%', borderRadius: size / 2 }]} />
    </View>
  );
}

export function SkeletonImage({ width = '100%', height = 200, style }) {
  return (
    <View style={[styles.skeleton, { width, height, borderRadius: 10 }, style]}>
      <Animated.View style={[styles.shimmer, { width: '50%' }]} />
    </View>
  );
}

export function SkeletonPost({ darkMode }) {
  return (
    <View style={[styles.postContainer, darkMode && styles.postContainerDark]}>
      <View style={styles.postHeader}>
        <SkeletonAvatar size={40} />
        <View style={styles.postHeaderInfo}>
          <SkeletonText width={120} height={14} />
          <SkeletonText width={80} height={12} style={{ marginTop: 5 }} />
        </View>
      </View>
      <SkeletonText width="90%" height={14} style={{ marginTop: 10 }} />
      <SkeletonText width="70%" height={14} style={{ marginTop: 5 }} />
      <SkeletonImage height={200} style={{ marginTop: 10 }} />
      <View style={styles.postActions}>
        <SkeletonText width={60} height={14} />
        <SkeletonText width={60} height={14} />
        <SkeletonText width={60} height={14} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3, darkMode }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonPost key={index} darkMode={darkMode} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  postContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  postContainerDark: {
    backgroundColor: '#1a1a2e',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});

export default {
  Text: SkeletonText,
  Avatar: SkeletonAvatar,
  Image: SkeletonImage,
  Post: SkeletonPost,
  List: SkeletonList,
};
