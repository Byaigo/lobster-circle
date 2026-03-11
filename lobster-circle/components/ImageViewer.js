/**
 * 图片预览组件
 */

import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Modal, TouchableOpacity,
  Dimensions, Image
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ImageViewer({ images, initialIndex = 0, visible, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images || images.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.counter}>
            {currentIndex + 1} / {images.length}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: images[currentIndex] }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {images.length > 1 && (
          <>
            <TouchableOpacity style={styles.navButton} onPress={handlePrev}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navButton, styles.navButtonRight]} onPress={handleNext}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  counter: { color: '#fff', fontSize: 16 },
  closeButton: { color: '#fff', fontSize: 28 },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height * 0.7,
  },
  navButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: 60,
  },
  navButtonRight: {
    left: 'auto',
    right: 20,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
});
