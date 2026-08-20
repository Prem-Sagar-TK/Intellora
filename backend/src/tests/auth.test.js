process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_must_be_32_characters_long_for_test';
process.env.JWT_REFRESH_SECRET = 'test_refresh_key_must_be_32_characters_long_for_test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../routes/authRoutes');
const errorHandler = require('../middleware/errorHandler');
const User = require('../models/User');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear users before each test
  await User.deleteMany({});
});

describe('Auth Controller Tests', () => {
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  };

  test('POST /api/auth/register - Success', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(mockUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('_id');
    expect(res.body.email).toBe(mockUser.email);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('refreshToken');
  });

  test('POST /api/auth/register - Validation Fail (bad email)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'J',
        email: 'invalid-email',
        password: '123',
      });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  test('POST /api/auth/register - Duplicate Email Fail', async () => {
    // Create initial user
    await request(app).post('/api/auth/register').send(mockUser);

    // Try creating duplicate
    const res = await request(app)
      .post('/api/auth/register')
      .send(mockUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('User already exists');
  });

  test('POST /api/auth/login - Success', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(mockUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/login - Incorrect Password Fail', async () => {
    await request(app).post('/api/auth/register').send(mockUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: mockUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });

  test('POST /api/auth/refresh - Success', async () => {
    // Register and get cookie
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(mockUser);

    const cookie = regRes.headers['set-cookie'][0];

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [cookie])
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/logout - Success', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send();

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toContain('refreshToken=');
  });
});
