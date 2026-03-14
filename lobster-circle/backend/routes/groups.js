/**
 * 群组 API
 * 支持创建群组、加入/退出、群管理等
 */

const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const VisitRecord = require('../models/VisitRecord');
const auth = require('../middleware/auth');

/**
 * GET /api/groups
 * 获取我加入的群组列表
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const groups = await Group.find({
      'members.user': req.user._id,
      status: 'active'
    })
      .populate('owner', 'nickname avatar')
      .select('name description avatar stats settings tags createdAt')
      .sort({ 'stats.memberCount': -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Group.countDocuments({
      'members.user': req.user._id,
      status: 'active'
    });
    
    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取群组列表失败:', error);
    res.status(500).json({ error: '获取群组列表失败' });
  }
});

/**
 * GET /api/groups/explore
 * 探索群组（推荐的公开群组）
 */
router.get('/explore', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, tag } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {
      'settings.joinType': 'open',
      status: 'active'
    };
    
    if (tag) {
      query.tags = tag;
    }
    
    const groups = await Group.find(query)
      .populate('owner', 'nickname avatar')
      .select('name description avatar stats tags settings createdAt')
      .sort({ 'stats.memberCount': -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Group.countDocuments(query);
    
    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('探索群组失败:', error);
    res.status(500).json({ error: '探索群组失败' });
  }
});

/**
 * GET /api/groups/:id
 * 获取群组详情
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('owner', 'nickname avatar gender age')
      .populate('members.user', 'nickname avatar gender age onlineStatus');
    
    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }
    
    // 记录访客
    if (group.owner._id.toString() !== req.user._id.toString()) {
      await VisitRecord.recordVisit(req.user._id, group.owner._id, 'profile');
    }
    
    const isMember = group.isMember(req.user._id);
    const isAdmin = group.isAdmin(req.user._id);
    
    res.json({
      success: true,
      data: {
        ...group.toObject(),
        isMember,
        isAdmin,
        memberCount: group.members.length
      }
    });
  } catch (error) {
    console.error('获取群组详情失败:', error);
    res.status(500).json({ error: '获取群组详情失败' });
  }
});

/**
 * POST /api/groups
 * 创建群组
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, tags, settings, location } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: '群组名称不能为空' });
    }
    
    const group = new Group({
      name: name.trim(),
      description: description?.trim() || '',
      tags: tags || [],
      settings: {
        joinType: settings?.joinType || 'open',
        maxMembers: settings?.maxMembers || 500,
        allowMembersInvite: settings?.allowMembersInvite ?? true,
        allowMembersPost: settings?.allowMembersPost ?? true,
        messageRetention: settings?.messageRetention || 365
      },
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'owner',
        joinedAt: new Date(),
        level: 1,
        points: 0
      }],
      stats: {
        memberCount: 1,
        messageCount: 0,
        activeToday: 0
      },
      location: location || undefined
    });
    
    await group.save();
    
    // 创建系统消息
    await GroupMessage.create({
      group: group._id,
      sender: req.user._id,
      type: 'system',
      systemData: {
        action: 'group_created',
        targetUser: req.user._id
      }
    });
    
    res.json({
      success: true,
      data: group,
      message: '群组创建成功'
    });
  } catch (error) {
    console.error('创建群组失败:', error);
    res.status(500).json({ error: '创建群组失败' });
  }
});

/**
 * POST /api/groups/:id/join
 * 加入群组
 */
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }
    
    if (group.status !== 'active') {
      return res.status(400).json({ error: '群组已解散或被封禁' });
    }
    
    if (group.isMember(req.user._id)) {
      return res.status(400).json({ error: '你已是群成员' });
    }
    
    // 检查是否需要审核
    if (group.settings.joinType === 'private') {
      return res.status(400).json({ error: '私密群组，无法直接加入' });
    }
    
    // 检查人数限制
    if (group.members.length >= group.settings.maxMembers) {
      return res.status(400).json({ error: '群成员已满' });
    }
    
    await group.addMember(req.user._id);
    
    // 创建系统消息
    await GroupMessage.create({
      group: group._id,
      type: 'system',
      systemData: {
        action: 'member_join',
        targetUser: req.user._id
      }
    });
    
    res.json({
      success: true,
      message: '加入群组成功'
    });
  } catch (error) {
    console.error('加入群组失败:', error);
    res.status(500).json({ error: '加入群组失败' });
  }
});

/**
 * POST /api/groups/:id/leave
 * 退出群组
 */
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }
    
    if (!group.isMember(req.user._id)) {
      return res.status(400).json({ error: '你不是群成员' });
    }
    
    await group.removeMember(req.user._id);
    
    // 创建系统消息
    await GroupMessage.create({
      group: group._id,
      type: 'system',
      systemData: {
        action: 'member_leave',
        targetUser: req.user._id
      }
    });
    
    res.json({
      success: true,
      message: '退出群组成功'
    });
  } catch (error) {
    console.error('退出群组失败:', error);
    res.status(500).json({ error: '退出群组失败' });
  }
});

/**
 * GET /api/groups/:id/messages
 * 获取群聊消息
 */
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, before } = req.query;
    const skip = (page - 1) * limit;
    
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }
    
    if (!group.isMember(req.user._id)) {
      return res.status(403).json({ error: '非群成员无法查看消息' });
    }
    
    const query = { group: group._id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await GroupMessage.find(query)
      .populate('sender', 'nickname avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await GroupMessage.countDocuments(query);
    
    res.json({
      success: true,
      data: messages.reverse(), // 按时间正序排列
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + messages.length < total
      }
    });
  } catch (error) {
    console.error('获取群消息失败:', error);
    res.status(500).json({ error: '获取群消息失败' });
  }
});

/**
 * POST /api/groups/:id/messages
 * 发送群消息
 */
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const { type = 'text', content, media, replyTo, mentions } = req.body;
    
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }
    
    if (!group.isMember(req.user._id)) {
      return res.status(403).json({ error: '非群成员无法发送消息' });
    }
    
    if (!group.settings.allowMembersPost && !group.isAdmin(req.user._id)) {
      return res.status(403).json({ error: '群主已禁止成员发言' });
    }
    
    const message = await GroupMessage.create({
      group: group._id,
      sender: req.user._id,
      type,
      content: content || '',
      media: media || {},
      replyTo: replyTo || null,
      mentions: mentions || []
    });
    
    // 更新群消息计数
    group.stats.messageCount += 1;
    await group.save();
    
    // 填充发送者信息
    await message.populate('sender', 'nickname avatar');
    
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('发送群消息失败:', error);
    res.status(500).json({ error: '发送群消息失败' });
  }
});

/**
 * PUT /api/groups/:id
 * 更新群组信息（仅管理员）
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }
    
    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({ error: '仅管理员可修改群组信息' });
    }
    
    const { name, description, avatar, cover, settings, announcement } = req.body;
    
    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar !== undefined) group.avatar = avatar;
    if (cover !== undefined) group.cover = cover;
    if (settings) {
      group.settings = { ...group.settings, ...settings };
    }
    if (announcement) {
      group.announcement = {
        content: announcement.content,
        author: req.user._id,
        updatedAt: new Date()
      };
    }
    
    group.updatedAt = new Date();
    await group.save();
    
    res.json({
      success: true,
      data: group,
      message: '群组信息更新成功'
    });
  } catch (error) {
    console.error('更新群组失败:', error);
    res.status(500).json({ error: '更新群组失败' });
  }
});

/**
 * DELETE /api/groups/:id
 * 解散群组（仅群主）
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }
    
    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '仅群主可解散群组' });
    }
    
    group.status = 'disbanded';
    await group.save();
    
    res.json({
      success: true,
      message: '群组已解散'
    });
  } catch (error) {
    console.error('解散群组失败:', error);
    res.status(500).json({ error: '解散群组失败' });
  }
});

module.exports = router;
