/**
 * 认证 API 测试
 */

const request = require('supertest');
const { app } = require('../server');
const mongoose = require('mongoose');

describe('认证 API', () => {
  // 测试前清理数据库
  beforeAll(async () => {
    await mongoose.connection.dropDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
    });

    it('应该拒绝空用户名', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: '', password: 'password123' });

      expect(response.status).toBe(400);
    });

    it('应该拒绝短密码', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser2', password: '123' });

      expect(response.status).toBe(400);
    });

    it('应该拒绝重复用户名', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password456' });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // 确保有测试用户
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'logintest', password: 'password123' });
    });

    it('应该成功登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    it('应该拒绝错误密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });
});
