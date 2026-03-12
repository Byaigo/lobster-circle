/**
 * 关于我们页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking, SafeAreaView, StatusBar } from 'react-native';

const APP_VERSION = '3.2.0';

export default function AboutScreen({ darkMode, navigation }) {
  const [stats, setStats] = useState({
    posts: 0,
    users: 0,
    days: 0
  });

  const openUrl = (url) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* 头部 */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>关于龙虾圈</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo 和版本 */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>🦞</Text>
          <Text style={[styles.appName, darkMode && styles.textDark]}>龙虾圈</Text>
          <Text style={[styles.version, darkMode && styles.textMuted]}>版本 {APP_VERSION}</Text>
        </View>

        {/* 简介 */}
        <View style={[styles.section, darkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>应用简介</Text>
          <Text style={[styles.sectionContent, darkMode && styles.textMuted]}>
            龙虾圈是一款原生社交 App，支持发布动态、点赞评论、好友聊天、通知中心等完整社交功能。
            采用 React Native + Node.js + MongoDB 技术栈，支持七牛云 CDN 图片存储和极光推送。
          </Text>
        </View>

        {/* 技术栈 */}
        <View style={[styles.section, darkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>技术栈</Text>
          <View style={styles.techList}>
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>⚛️</Text>
              <Text style={[styles.techName, darkMode && styles.textDark]}>React Native</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>🟢</Text>
              <Text style={[styles.techName, darkMode && styles.textDark]}>Node.js</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>🍃</Text>
              <Text style={[styles.techName, darkMode && styles.textDark]}>MongoDB</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>📡</Text>
              <Text style={[styles.techName, darkMode && styles.textDark]}>Socket.io</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>☁️</Text>
              <Text style={[styles.techName, darkMode && styles.textDark]}>七牛云</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>📱</Text>
              <Text style={[styles.techName, darkMode && styles.textDark]}>极光推送</Text>
            </View>
          </View>
        </View>

        {/* 相关链接 */}
        <View style={[styles.section, darkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>相关链接</Text>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openUrl('https://github.com/Byaigo/lobster-circle')}
          >
            <Text style={styles.linkIcon}>📦</Text>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, darkMode && styles.textDark]}>GitHub 仓库</Text>
              <Text style={[styles.linkDesc, darkMode && styles.textMuted]}>查看源码和更新日志</Text>
            </View>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openUrl('https://github.com/Byaigo/lobster-circle/issues')}
          >
            <Text style={styles.linkIcon}>🐛</Text>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, darkMode && styles.textDark]}>问题反馈</Text>
              <Text style={[styles.linkDesc, darkMode && styles.textMuted]}>提交 Bug 或建议</Text>
            </View>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openUrl('https://github.com/Byaigo/lobster-circle/blob/main/DEPLOY_PRODUCTION.md')}
          >
            <Text style={styles.linkIcon}>📖</Text>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, darkMode && styles.textDark]}>部署文档</Text>
              <Text style={[styles.linkDesc, darkMode && styles.textMuted]}>生产环境部署指南</Text>
            </View>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 开发团队 */}
        <View style={[styles.section, darkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>开发团队</Text>
          <Text style={[styles.sectionContent, darkMode && styles.textMuted]}>
            龙虾圈由独立开发者开发，采用 MIT 开源许可证。
            欢迎 Star、Fork 和贡献代码！
          </Text>
        </View>

        {/* 版权信息 */}
        <View style={styles.footer}>
          <Text style={[styles.copyright, darkMode && styles.textMuted]}>
            © 2026 龙虾圈 • MIT License
          </Text>
          <Text style={[styles.madeWith, darkMode && styles.textMuted]}>
            Made with 🦞 and ❤️
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
  
  content: { flex: 1 },
  
  logoSection: { alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  logo: { fontSize: 80 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginTop: 10 },
  version: { fontSize: 14, color: '#999', marginTop: 5 },
  
  section: { backgroundColor: '#fff', marginVertical: 8, padding: 20 },
  sectionDark: { backgroundColor: '#1a1a2e' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  sectionContent: { fontSize: 14, color: '#666', lineHeight: 22 },
  
  techList: { flexDirection: 'row', flexWrap: 'wrap' },
  techItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20, marginBottom: 10 },
  techIcon: { fontSize: 20, marginRight: 6 },
  techName: { fontSize: 14, color: '#333' },
  
  linkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  linkIcon: { fontSize: 24, marginRight: 12 },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 15, color: '#333', marginBottom: 3 },
  linkDesc: { fontSize: 13, color: '#999' },
  linkArrow: { fontSize: 18, color: '#ccc' },
  
  footer: { alignItems: 'center', padding: 30 },
  copyright: { fontSize: 13, color: '#999', marginBottom: 8 },
  madeWith: { fontSize: 13, color: '#999' }
});
