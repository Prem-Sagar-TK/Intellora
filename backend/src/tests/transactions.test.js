process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_must_be_32_characters_long_for_test';
process.env.JWT_REFRESH_SECRET = 'test_refresh_key_must_be_32_characters_long_for_test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const transactionRoutes = require('../routes/transactionRoutes');
const authRoutes = require('../routes/authRoutes');
const errorHandler = require('../middleware/errorHandler');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

let mongoServer;
let app;
let authToken;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use(errorHandler);

  // Create a default user and get token
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Transaction User',
      email: 'tx@example.com',
      password: 'password123',
    });
  
  authToken = `Bearer ${regRes.body.token}`;
  userId = regRes.body._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Transaction.deleteMany({});
});

describe('Transaction Controller Tests', () => {
  const mockTx = {
    amount: 150.50,
    type: 'expense',
    category: 'Food',
    description: 'Groceries',
    date: new Date().toISOString(),
    isRecurring: false,
  };

  test('POST /api/transactions - Success', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', authToken)
      .send(mockTx);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.amount).toBe(mockTx.amount);
    expect(res.body.category).toBe(mockTx.category);
  });

  test('POST /api/transactions - Validation Fail (missing category)', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', authToken)
      .send({
        amount: 50,
        type: 'expense',
      });

    expect(res.status).toBe(422);
  });

  test('GET /api/transactions - Pagination envelope structure', async () => {
    // Insert 5 transactions
    for (let i = 0; i < 5; i++) {
      await Transaction.create({
        user: userId,
        amount: 10 * (i + 1),
        type: 'expense',
        category: 'Food',
        date: new Date(),
      });
    }

    const res = await request(app)
      .get('/api/transactions?page=1&limit=2')
      .set('Authorization', authToken);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total', 5);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('pages', 3);
    expect(res.body.data.length).toBe(2);
  });

  test('PUT /api/transactions/:id - Success', async () => {
    const created = await Transaction.create({
      user: userId,
      amount: 100,
      type: 'expense',
      category: 'Food',
      date: new Date(),
    });

    const res = await request(app)
      .put(`/api/transactions/${created._id}`)
      .set('Authorization', authToken)
      .send({
        amount: 250,
      });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(250);
  });

  test('DELETE /api/transactions/:id - Success', async () => {
    const created = await Transaction.create({
      user: userId,
      amount: 100,
      type: 'expense',
      category: 'Food',
      date: new Date(),
    });

    const res = await request(app)
      .delete(`/api/transactions/${created._id}`)
      .set('Authorization', authToken);

    expect(res.status).toBe(200);
    
    const count = await Transaction.countDocuments({ _id: created._id });
    expect(count).toBe(0);
  });

  test('POST /api/transactions/upload - Invalid File Extension Fail', async () => {
    // Create a temporary non-csv file
    const tempFile = path.join(__dirname, 'test.txt');
    fs.writeFileSync(tempFile, 'invalid file contents');

    const res = await request(app)
      .post('/api/transactions/upload')
      .set('Authorization', authToken)
      .attach('file', tempFile);

    fs.unlinkSync(tempFile);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Only CSV files are allowed');
  });
});
