/**
 * 编辑个人资料页面
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen({ darkMode, navigation, currentUser, onUpdateUser }) {
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '😎');
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('提示', '需要访问相册权限');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('提示', '用户名不能为空');
      return;
    }

    if (username.length < 2 || username.length > 20) {
      Alert.alert('提示', '用户名长度 2-20 个字符');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      
      // 上传头像（如果是图片）
      let avatarUrl = avatar;
      if (avatar && avatar.startsWith('http')) {
        // 已经是 URL
      } else if (avatar && avatar.includes('://')) {
        // 本地图片，需要上传
        const formData = new FormData();
        formData.append('avatar', {
          uri: avatar,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });

        const uploadRes = await fetch(`${API_BASE_URL}/upload/avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          avatarUrl = uploadData.url;
        }
      }

      // 更新用户信息
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          bio,
          avatar: avatarUrl,
        }),
      });

      const data = await response.json();

      if (data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        if (onUpdateUser) {
          onUpdateUser(data.user);
        }
        Alert.alert('保存成功', '个人资料已更新');
        navigation.goBack();
      } else {
        Alert.alert('错误', data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      // 本地更新
      const updatedUser = { ...currentUser, username, bio, avatar };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      Alert.alert('保存成功', '个人资料已更新（离线模式）');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* 头部 */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>编辑资料</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 头像 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
            {avatar && avatar.startsWith('http') ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarEmoji}>{avatar}</Text>
            )}
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, darkMode && styles.textMuted]}>点击更换头像</Text>
        </View>

        {/* 用户名 */}
        <View style={[styles.field, darkMode && styles.fieldDark]}>
          <Text style={[styles.label, darkMode && styles.textDark]}>用户名</Text>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark]}
            value={username}
            onChangeText={setUsername}
            placeholder="2-20 个字符"
            placeholderTextColor="#999"
            maxLength={20}
          />
          <Text style={[styles.charCount, darkMode && styles.textMuted]}>
            {username.length}/20
          </Text>
        </View>

        {/* 简介 */}
        <View style={[styles.field, darkMode && styles.fieldDark]}>
          <Text style={[styles.label, darkMode && styles.textDark]}>个人简介</Text>
          <TextInput
            style={[styles.textarea, darkMode && styles.textareaDark]}
            value={bio}
            onChangeText={setBio}
            placeholder="介绍一下自己"
            placeholderTextColor="#999"
            multiline
            maxLength={100}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, darkMode && styles.textMuted]}>
            {bio.length}/100
          </Text>
        </View>

        {/* 提示信息 */}
        <View style={[styles.tipCard, darkMode && styles.tipCardDark]}>
          <Text style={[styles.tipTitle, darkMode && styles.textDark]}>💡 提示</Text>
          <Text style={[styles.tipText, darkMode && styles.textMuted]}>
            • 头像支持 JPG、PNG 格式，建议尺寸 200x200{'\n'}
            • 用户名设置后不可修改，请谨慎填写{'\n'}
            • 个人简介可以帮助别人更好地了解你
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { flex: 1, backgroundColor: '#0f0f1a' },
  textDark: { color: '#fff' },
  textMuted: { color: '#888' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerDark: { backgroundColor: '#1a1a2e', borderBottomColor: '#333' },
  backButton: { fontSize: 24, color: '#00ff88', paddingHorizontal: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  saveButton: { color: '#00ff88', fontWeight: 'bold', paddingHorizontal: 10 },
  saveButtonDisabled: { color: '#999' },
  
  content: { flex: 1 },
  
  avatarSection: { alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarEmoji: { fontSize: 100, width: 120, height: 120, textAlign: 'center', lineHeight: 120 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ff88', alignItems: 'center', justifyContent: 'center' },
  cameraIconText: { fontSize: 20 },
  avatarHint: { fontSize: 14, color: '#999', marginTop: 10 },
  
  field: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10 },
  fieldDark: { backgroundColor: '#1a1a2e' },
  label: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15 },
  inputDark: { borderColor: '#333', color: '#fff' },
  textarea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, minHeight: 100 },
  textareaDark: { borderColor: '#333', color: '#fff' },
  charCount: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 5 },
  
  tipCard: { margin: 15, padding: 15, backgroundColor: '#f0f8ff', borderRadius: 10 },
  tipCardDark: { backgroundColor: '#1a2a3e' },
  tipTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 10 },
  tipText: { fontSize: 13, color: '#666', lineHeight: 20 },
});
