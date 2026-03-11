/**
 * 积分商城 API
 */

const express = require('express');
const router = express.Router();
const PointsLog = require('../models/PointsLog');
const User = require('../models/User');
const auth = require('../middleware/auth');

// 商品列表（模拟）
const products = [
  { id: '1', name: '龙虾圈定制 T 恤', points: 500, stock: 100, image: 'https://picsum.photos/200/200' },
  { id: '2', name: '龙虾圈徽章', points: 200, stock: 500, image: 'https://picsum.photos/200/200' },
  { id: '3', name: '积分抵扣券 10 元', points: 1000, stock: 50, image: 'https://picsum.photos/200/200' },
  { id: '4', name: '龙虾圈贴纸', points: 100, stock: 1000, image: 'https://picsum.photos/200/200' },
];

// 获取商品列表
router.get('/products', async (req, res) => {
  try {
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

// 兑换商品
router.post('/exchange', auth, async (req, res) => {
  try {
    const { productId, address } = req.body;
    
    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ error: '商品已缺货' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if ((user.points || 0) < product.points) {
      return res.status(400).json({ error: '积分不足' });
    }

    // 扣除积分
    user.points -= product.points;
    await user.save();

    // 记录积分日志
    await PointsLog.create({
      userId: req.user._id,
      type: 'exchange',
      points: -product.points,
      balance: user.points,
      description: `兑换商品：${product.name}`
    });

    // 减少库存
    product.stock--;

    res.json({
      message: '兑换成功',
      order: {
        productId: product.id,
        productName: product.name,
        points: product.points,
        address,
        createdAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ error: '兑换失败' });
  }
});

// 我的兑换记录
router.get('/orders', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // 模拟订单记录
    const orders = [
      { id: '1', productName: '龙虾圈贴纸', points: 100, status: '已发货', createdAt: new Date() },
    ];

    res.json({ orders, totalPages: 1, currentPage: page });
  } catch (error) {
    res.status(500).json({ error: '获取订单失败' });
  }
});

module.exports = router;
