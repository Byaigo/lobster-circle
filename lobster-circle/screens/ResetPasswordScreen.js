/**
 * 密码找回/重置页面
 */

import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { API_BASE_URL } from '../config';

export default function ResetPasswordScreen({ navigation, darkMode }) {
  const [step, setStep] = useState(1); // 1: 输入用户名，2: 输入令牌，3: 重置密码
  const [username, setUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!username.trim()) {
      Alert.alert('提示', '请输入用户名');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/password-reset/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (data.resetToken) {
        Alert.alert(
          '重置令牌',
          `您的重置令牌是：${data.resetToken}\n\n（生产环境应该通过邮件发送）`,
          [{ text: '好的', onPress: () => setStep(2) }]
        );
      } else {
        setStep(2);
      }
    } catch (error) {
      Alert.alert('错误', '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim()) {
      Alert.alert('提示', '请输入重置令牌');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('提示', '密码至少 6 个字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/password-reset/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await response.json();

      if (data.message) {
        Alert.alert('成功', '密码已重置，请登录', [
          { text: '好的', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('错误', data.error || '重置失败');
      }
    } catch (error) {
      Alert.alert('错误', '重置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={[styles.title, darkMode && styles.textDark]}>🔐 找回密码</Text>
          <Text style={[styles.subtitle, darkMode && styles.textMuted]}>
            {step === 1 && '请输入您的用户名'}
            {step === 2 && '请输入重置令牌和新密码'}
          </Text>
        </View>

        {step === 1 ? (
          <>
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="用户名"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRequestReset}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '请求中...' : '获取重置令牌'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="重置令牌"
              placeholderTextColor="#999"
              value={resetToken}
              onChangeText={setResetToken}
            />
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="新密码（至少 6 位）"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="确认密码"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '重置中...' : '重置密码'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(1)}
            >
              <Text style={styles.backButtonText}>返回上一步</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>返回登录</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { flex: 1, backgroundColor: '#0f0f1a' },
  textDark: { color: '#fff' },
  textMuted: { color: '#888' },
  inputDark: { backgroundColor: '#1a1a2e', color: '#fff', borderColor: '#333' },
  keyboardView: { flex: 1, justifyContent: 'center' },
  header: { padding: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14 },
  input: {
    marginHorizontal: 30,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    margin: 30,
    padding: 15,
    backgroundColor: '#00ff88',
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  backButton: { marginHorizontal: 30, padding: 10, alignItems: 'center' },
  backButtonText: { color: '#666', fontSize: 14 },
  loginButton: { margin: 30, padding: 15, alignItems: 'center' },
  loginButtonText: { color: '#00ff88', fontSize: 16, fontWeight: 'bold' },
});
