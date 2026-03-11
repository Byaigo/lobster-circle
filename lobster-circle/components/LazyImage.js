/**
 * 图片懒加载组件
 */

import React, { useState, useEffect } from 'react';
import { Image, ActivityIndicator, View, StyleSheet } from 'react-native';

export default function LazyImage({
  source,
  style,
  placeholderColor = '#f0f0f0',
  resizeMode = 'cover'
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={[styles.placeholder, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
      
      {!error && (
        <Image
          source={source}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
      
      {error && (
        <View style={[styles.error, { backgroundColor: placeholderColor }]}>
          <View style={styles.errorIcon}>
            <View style={styles.errorLine1} />
            <View style={styles.errorLine2} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    ...StyleSheet.absoluteFillObject
  },
  error: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorLine1: {
    width: 30,
    height: 2,
    backgroundColor: '#ccc',
    marginBottom: 4
  },
  errorLine2: {
    width: 20,
    height: 2,
    backgroundColor: '#ccc'
  }
});
