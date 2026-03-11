/**
 * 七牛云存储集成
 */

const qiniu = require('qiniu');
const path = require('path');
const fs = require('fs');

class QiniuService {
  constructor() {
    this.accessKey = process.env.QINIU_ACCESS_KEY;
    this.secretKey = process.env.QINIU_SECRET_KEY;
    this.bucket = process.env.QINIU_BUCKET;
    this.domain = process.env.QINIU_DOMAIN;
    
    this.mac = new qiniu.auth.digest.Mac(this.accessKey, this.secretKey);
    
    this.config = new qiniu.conf.Config();
    // 区域设置，根据实际存储区域选择
    this.config.zone = qiniu.zone.Zone_z2; // 华南
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  // 生成上传凭证
  getUploadToken() {
    const options = {
      scope: this.bucket,
      expires: 3600 // 1 小时有效期
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    return putPolicy.uploadToken(this.mac);
  }

  // 上传文件
  async uploadFile(localFilePath, key) {
    try {
      const uploadToken = this.getUploadToken();
      const formUploader = new qiniu.form_up.FormUploader(this.config);
      const putExtra = new qiniu.form_up.PutExtra();

      return new Promise((resolve, reject) => {
        formUploader.putFile(uploadToken, key, localFilePath, putExtra, (respErr, respBody, respInfo) => {
          if (respErr) {
            reject(respErr);
          } else if (respInfo.statusCode === 200) {
            const imageUrl = `${this.domain}/${respBody.key}`;
            resolve({
              success: true,
              url: imageUrl,
              key: respBody.key,
              hash: respBody.hash
            });
          } else {
            reject(new Error(`上传失败：${respInfo.statusCode}`));
          }
        });
      });
    } catch (error) {
      console.error('七牛云上传失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 批量上传
  async uploadFiles(files) {
    const results = [];
    for (const file of files) {
      const key = `lobster/${Date.now()}_${path.basename(file)}`;
      const result = await this.uploadFile(file, key);
      results.push(result);
    }
    return results;
  }

  // 删除文件
  async deleteFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(this.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else if (respInfo.statusCode === 200) {
          resolve({ success: true });
        } else {
          reject(new Error(`删除失败：${respInfo.statusCode}`));
        }
      });
    });
  }

  // 获取文件信息
  async statFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.stat(this.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else if (respInfo.statusCode === 200) {
          resolve(respBody);
        } else {
          reject(new Error(`获取信息失败：${respInfo.statusCode}`));
        }
      });
    });
  }
}

module.exports = new QiniuService();
