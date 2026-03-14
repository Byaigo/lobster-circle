/**
 * 附近的人 API
 * 基于地理位置发现附近用户
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const VisitRecord = require('../models/VisitRecord');
const auth = require('../middleware/auth');

/**
 * GET /api/nearby/users
 * 获取附近的用户
 * 参数：lat, lng, radius (公里), page, limit
 */
router.get('/users', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 20 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: '需要提供经纬度坐标' });
    }
    
    const skip = (page - 1) * limit;
    const radiusInRadians = (radius || 10) / 6371; // 地球半径约 6371 公里
    
    // 使用地理位置查询附近的用户
    const users = await User.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: (radius || 10) * 1000 // 转换为米
        }
      },
      _id: { $ne: req.user._id }, // 排除自己
      'privacy.showInNearby': { $ne: false } // 排除隐藏的用户
    })
      .select('nickname avatar gender age location bio onlineStatus lastSeen')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: (radius || 10) * 1000
        }
      },
      _id: { $ne: req.user._id },
      'privacy.showInNearby': { $ne: false }
    });
    
    // 计算每个用户的距离
    const usersWithDistance = users.map(user => {
      const userLoc = user.location?.coordinates || [0, 0];
      const distance = calculateDistance(
        parseFloat(lat), parseFloat(lng),
        userLoc[1], userLoc[0]
      );
      
      return {
        ...user.toObject(),
        distance: distance.toFixed(2) // 保留 2 位小数
      };
    });
    
    res.json({
      success: true,
      data: usersWithDistance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取附近用户失败:', error);
    res.status(500).json({ error: '获取附近用户失败' });
  }
});

/**
 * POST /api/nearby/update-location
 * 更新用户位置
 */
router.post('/update-location', auth, async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: '需要提供经纬度坐标' });
    }
    
    req.user.location = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)],
      address: address || ''
    };
    req.user.locationUpdatedAt = new Date();
    
    await req.user.save();
    
    res.json({
      success: true,
      message: '位置更新成功'
    });
  } catch (error) {
    console.error('更新位置失败:', error);
    res.status(500).json({ error: '更新位置失败' });
  }
});

/**
 * GET /api/nearby/stats
 * 获取附近的人统计
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: '需要提供经纬度坐标' });
    }
    
    const totalNearby = await User.countDocuments({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: (radius || 10) * 1000
        }
      },
      _id: { $ne: req.user._id },
      'privacy.showInNearby': { $ne: false }
    });
    
    const onlineCount = await User.countDocuments({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: (radius || 10) * 1000
        }
      },
      _id: { $ne: req.user._id },
      onlineStatus: 'online',
      'privacy.showInNearby': { $ne: false }
    });
    
    res.json({
      success: true,
      data: {
        total: totalNearby,
        online: onlineCount,
        radius: radius || 10
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 辅助函数：计算两点间距离（Haversine 公式）
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

module.exports = router;
