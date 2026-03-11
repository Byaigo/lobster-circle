/**
 * 🦞 MongoDB 自动备份脚本
 * 
 * 使用方法：
 * node scripts/backup.js
 * 
 * 配置定时任务（Linux）：
 * crontab -e
 * 0 2 * * * /usr/bin/node /path/to/backup.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// 配置
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lobster-circle';
const DB_NAME = 'lobster-circle';
const RETENTION_DAYS = 7; // 保留 7 天备份

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 生成备份文件名
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `lobster-circle-${timestamp}.gz`);

// 执行备份
function backup() {
  return new Promise((resolve, reject) => {
    const command = `mongodump --uri="${MONGODB_URI}" --archive="${backupFile}" --gzip`;
    
    console.log('🔄 开始备份...');
    console.log('📁 备份文件:', backupFile);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ 备份失败:', error);
        reject(error);
        return;
      }
      
      console.log('✅ 备份成功！');
      console.log('📦 文件大小:', getFileSize(backupFile));
      resolve(backupFile);
    });
  });
}

// 获取文件大小
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;
  const mb = (bytes / 1024 / 1024).toFixed(2);
  return `${mb} MB`;
}

// 清理旧备份
function cleanup() {
  console.log('🧹 清理旧备份...');
  
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  
  files.forEach(file => {
    if (!file.endsWith('.gz')) return;
    
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;
    
    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log('🗑️ 删除旧备份:', file);
    }
  });
  
  console.log('✅ 清理完成！');
}

// 主函数
async function main() {
  try {
    await backup();
    cleanup();
    console.log('🎉 备份任务完成！');
    process.exit(0);
  } catch (error) {
    console.error('💥 备份任务失败:', error);
    process.exit(1);
  }
}

main();
