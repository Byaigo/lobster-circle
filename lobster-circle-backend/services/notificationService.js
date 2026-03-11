/**
 * 实时通知服务
 */

const notifications = new Map(); // userId -> Set of socketIds

// 用户连接
const addUser = (userId, socketId) => {
  if (!notifications.has(userId)) {
    notifications.set(userId, new Set());
  }
  notifications.get(userId).add(socketId);
  console.log(`用户 ${userId} 连接，当前连接数：${notifications.get(userId).size}`);
};

// 用户断开
const removeUser = (userId, socketId) => {
  if (notifications.has(userId)) {
    notifications.get(userId).delete(socketId);
    if (notifications.get(userId).size === 0) {
      notifications.delete(userId);
    }
    console.log(`用户 ${userId} 断开，当前连接数：${notifications.get(userId)?.size || 0}`);
  }
};

// 发送通知给特定用户
const sendToUser = (io, userId, notification) => {
  const socketIds = notifications.get(userId);
  if (socketIds) {
    socketIds.forEach(socketId => {
      io.to(socketId).emit('notification', notification);
    });
    console.log(`发送通知给用户 ${userId}: ${notification.type}`);
  }
};

// 发送通知给多个用户
const sendToUsers = (io, userIds, notification) => {
  userIds.forEach(userId => sendToUser(io, userId, notification));
};

// 广播通知
const broadcast = (io, notification, excludeUserId = null) => {
  notifications.forEach((socketIds, userId) => {
    if (userId !== excludeUserId) {
      socketIds.forEach(socketId => {
        io.to(socketId).emit('notification', notification);
      });
    }
  });
};

// 获取在线用户数
const getOnlineCount = () => {
  return notifications.size;
};

// 获取用户在线状态
const isUserOnline = (userId) => {
  return notifications.has(userId);
};

module.exports = {
  addUser,
  removeUser,
  sendToUser,
  sendToUsers,
  broadcast,
  getOnlineCount,
  isUserOnline,
  notifications
};
