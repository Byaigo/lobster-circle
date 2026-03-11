/**
 * 极光推送服务
 */

const JPush = require('jpush-sdk');

class PushService {
  constructor() {
    this.client = JPush.buildClient(
      process.env.JPUSH_APP_KEY,
      process.env.JPUSH_MASTER_SECRET
    );
  }

  // 发送单个推送
  async sendPush(userId, title, content, extras = {}) {
    try {
      const pushResult = await this.client.push().setPlatform('all')
        .setAudience(JPush.alias(userId))
        .setNotification(JPush.notification(content, title, null, extras))
        .send();
      
      console.log('推送成功:', pushResult);
      return { success: true };
    } catch (error) {
      console.error('推送失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 推送给所有用户
  async broadcast(title, content, extras = {}) {
    try {
      const pushResult = await this.client.push().setPlatform('all')
        .setAudience(JPush.all())
        .setNotification(JPush.notification(content, title, null, extras))
        .send();
      
      console.log('群发成功:', pushResult);
      return { success: true };
    } catch (error) {
      console.error('群发失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 推送点赞通知
  async sendLikeNotification(userId, fromUser, postId) {
    return await this.sendPush(userId, '新的点赞', `${fromUser} 赞了你的动态`, {
      type: 'like',
      postId
    });
  }

  // 推送评论通知
  async sendCommentNotification(userId, fromUser, postId, commentText) {
    return await this.sendPush(userId, '新的评论', `${fromUser}: ${commentText}`, {
      type: 'comment',
      postId
    });
  }

  // 推送好友请求
  async sendFriendRequestNotification(userId, fromUser) {
    return await this.sendPush(userId, '新的好友请求', `${fromUser} 想和你做朋友`, {
      type: 'friend_request',
      fromUser
    });
  }

  // 推送系统消息
  async sendSystemNotification(userId, title, content) {
    return await this.sendPush(userId, title, content, {
      type: 'system'
    });
  }
}

module.exports = new PushService();
