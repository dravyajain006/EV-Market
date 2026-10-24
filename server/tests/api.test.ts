import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Backend API Integration Tests', () => {
  let authToken = '';

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /health - should return 200 HEALTHY status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.service).toBe('ev-market-analysis-backend');
  });

  it('POST /api/v1/auth/login - should authenticate valid user and return JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@evmarket.internal',
        password: 'Admin@2026!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@evmarket.internal');
    expect(res.body.data.user.role).toBe('ADMIN');

    authToken = res.body.data.token;
  });

  it('POST /api/v1/auth/login - should reject invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@evmarket.internal',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me - should return authenticated user profile with Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('ADMIN');
  });

  it('GET /api/v1/analytics/overview - should return calculated KPIs and category shares', async () => {
    const res = await request(app).get('/api/v1/analytics/overview?year=2025');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpiSummary.totalEvRegistrations).toBeGreaterThan(0);
    expect(res.body.data.kpiSummary.evPenetrationPct).toBeGreaterThan(0);
    expect(res.body.data.categoryDistribution.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/analytics/trends - should return chronological national and category trends', async () => {
    const res = await request(app).get('/api/v1/analytics/trends');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nationalTrends.length).toBeGreaterThan(3);
  });

  it('GET /api/v1/analytics/regions - should return state-wise EV adoption statistics', async () => {
    const res = await request(app).get('/api/v1/analytics/regions?year=2025');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(10);
    // Highest state volume should be at the top
    expect(res.body.data[0].evRegistrations).toBeGreaterThanOrEqual(res.body.data[1].evRegistrations);
  });
});
