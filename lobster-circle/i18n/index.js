/**
 * 国际化配置
 */

import { I18nManager } from 'react-native';
import en from './en';
import zh from './zh';

const translations = {
  en,
  zh
};

let currentLocale = 'zh'; // 默认中文

// 设置语言
export const setLocale = (locale) => {
  if (translations[locale]) {
    currentLocale = locale;
    I18nManager.allowRTL(locale === 'ar' || locale === 'he');
  }
};

// 获取翻译
export const t = (key, params = {}) => {
  const keys = key.split('.');
  let value = translations[currentLocale];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (_, key) => params[key] || '');
  }
  
  return key; // 找不到返回原 key
};

// 获取当前语言
export const getLocale = () => currentLocale;

// 获取所有支持的语言
export const getSupportedLocales = () => Object.keys(translations);

export default {
  setLocale,
  t,
  getLocale,
  getSupportedLocales
};
