// 🦞 龙虾圈配置文件

// 后端 API 地址
export const API_BASE_URL = 'http://localhost:3000/api';
// 如果使用云端部署，改为：
// export const API_BASE_URL = 'https://your-api.herokuapp.com/api';

// WebSocket 地址
export const SOCKET_URL = 'http://localhost:3000';
// 如果使用云端部署，改为：
// export const SOCKET_URL = 'https://your-api.herokuapp.com';

// App 配置
export const APP_CONFIG = {
  name: '龙虾圈',
  version: '2.0.0',
  maxPostLength: 1000,
  maxMessageLength: 2000,
  maxImagesPerPost: 9,
  pageSize: 20
};
