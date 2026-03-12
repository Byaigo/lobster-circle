/**
 * 懒加载图片组件
 * 支持渐进式加载、缓存、占位图
 */

import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = 'image_cache_';

export default function LazyImage({
  source,
  style,
  placeholderColor = '#e0e0e0',
  useCache = true,
  resizeMode = 'cover',
  onLoad,
  onError,
}) {
  const [loading, setLoading] = useState(true);
  const [cachedImage, setCachedImage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadCachedImage();
  }, [source.uri]);

  const loadCachedImage = async () => {
    if (!useCache || !source.uri) return;

    try {
      const cacheKey = CACHE_KEY_PREFIX + source.uri.replace(/[^a-zA-Z0-9]/g, '_');
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        setCachedImage(cachedData);
        setLoading(false);
      }
    } catch (error) {
      console.error('加载缓存失败:', error);
    }
  };

  const handleLoad = async (event) => {
    setLoading(false);
    
    if (useCache && source.uri) {
      try {
        const cacheKey = CACHE_KEY_PREFIX + source.uri.replace(/[^a-zA-Z0-9]/g, '_');
        await AsyncStorage.setItem(cacheKey, source.uri);
      } catch (error) {
        console.error('缓存图片失败:', error);
      }
    }

    if (onLoad) {
      onLoad(event);
    }
  };

  const handleError = (error) => {
    setLoading(false);
    setError(true);
    
    if (onError) {
      onError(error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={[styles.placeholder, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator color="#fff" size="small" />
        </View>
      )}
      
      {!error && (
        <Image
          source={{
            uri: cachedImage || source.uri,
            cache: useCache ? 'force-cache' : 'default',
          }}
          style={[
            styles.image,
            { opacity: loading ? 0 : 1 },
            style,
          ]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {error && (
        <View style={[styles.errorPlaceholder, { backgroundColor: placeholderColor }]}>
          <Text style={styles.errorText}>⚠️</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 24,
  },
});
