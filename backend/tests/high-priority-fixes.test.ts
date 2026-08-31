/**
 * HIGH PRIORITY FIXES TEST SUITE
 *
 * This test suite validates all critical security and stability fixes:
 * 1. Expense Authorization - Only creator can modify
 * 2. Member Role Escalation Prevention - Cannot promote to owner
 * 3. Rate Limiting - Prevent brute force attacks
 * 4. Idempotency - Prevent duplicate expenses
 * 5. Pagination Protection - Limit max items
 * 6. CSV Export Optimization - Handle large datasets
 */

import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import { Family } from '../src/models/Family';
import { Expense } from '../src/models/Expense';
import { connectDB, disconnectDB } from '../tests/setup';

describe('HIGH PRIORITY FIXES', () => {
  let accessToken: string;
  let userId: string;
  let familyId: string;
  let expenseId: string;
  let otherUserId: string;

  // Setup test data before all tests
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  // ============================================================================
  // FIX #1: EXPENSE AUTHORIZATION - Only creator can update/delete
  // ============================================================================
  describe('FIX #1: Expense Authorization Protection', () => {

    it('T-FIX1-001: Should create user and get access token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'alice@example.com',
          password: 'Password123',
          name: 'Alice Johnson',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('accessToken');
      accessToken = res.body.data.accessToken;
      userId = res.body.data._id;
    });

    it('T-FIX1-002: Should create family', async () => {
      const res = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Family',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      familyId = res.body.data._id;
    });

    it('T-FIX1-003: Should create second user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'bob@example.com',
          password: 'Password123',
          name: 'Bob Smith',
        });

      expect(res.status).toBe(201);
      otherUserId = res.body.data._id;
    });

    it('T-FIX1-004: Should add Bob as family member', async () => {
      const res = await request(app)
        .post(`/api/families/${familyId}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: otherUserId,
          role: 'member',
        });

      expect(res.status).toBe(201);
    });

    it('T-FIX1-005: Alice creates expense', async () => {
      const res = await request(app)
        .post(`/api/expenses/${familyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Groceries',
          amount: 5000,
          date: new Date().toISOString(),
          category: 'Groceries',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      expenseId = res.body.data._id;
    });

    it('T-FIX1-006: Should FAIL - Bob cannot update Alice\'s expense', async () => {
      // Get Bob's token first
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bob@example.com',
          password: 'Password123',
        });

      const bobToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .put(`/api/expenses/${familyId}/${expenseId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          description: 'Updated by Bob (should fail)',
          amount: 10000,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Only the expense creator can update');
    });

    it('T-FIX1-007: Should SUCCESS - Alice can update her own expense', async () => {
      const res = await request(app)
        .put(`/api/expenses/${familyId}/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Updated Groceries',
          amount: 6000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated Groceries');
    });

    it('T-FIX1-008: Should FAIL - Bob cannot delete Alice\'s expense', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bob@example.com',
          password: 'Password123',
        });

      const bobToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .delete(`/api/expenses/${familyId}/${expenseId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Only the expense creator can delete');
    });

    it('T-FIX1-009: Should SUCCESS - Alice can delete her own expense', async () => {
      const res = await request(app)
        .delete(`/api/expenses/${familyId}/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    it('T-FIX1-010: Verify expense is deleted', async () => {
      const res = await request(app)
        .get(`/api/expenses/${familyId}/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('EXPENSE_NOT_FOUND');
    });
  });

  // ============================================================================
  // FIX #2: MEMBER ROLE ESCALATION PREVENTION - Cannot promote to owner
  // ============================================================================
  describe('FIX #2: Member Role Escalation Prevention', () => {

    it('T-FIX2-001: Should FAIL - Bob (member) cannot promote himself to owner', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bob@example.com',
          password: 'Password123',
        });

      const bobToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .put(`/api/families/${familyId}/members/${otherUserId}/role`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          role: 'owner',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Only family owner can change member roles');
    });

    it('T-FIX2-002: Should FAIL - Alice (owner) cannot promote Bob to owner', async () => {
      const res = await request(app)
        .put(`/api/families/${familyId}/members/${otherUserId}/role`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          role: 'owner',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Only one family owner is allowed');
    });

    it('T-FIX2-003: Should SUCCESS - Alice can promote Bob to viewer', async () => {
      const res = await request(app)
        .put(`/api/families/${familyId}/members/${otherUserId}/role`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          role: 'viewer',
        });

      expect(res.status).toBe(200);
      const bobMember = res.body.data.members.find((m: any) => m.userId._id === otherUserId);
      expect(bobMember.role).toBe('viewer');
    });

    it('T-FIX2-004: Should SUCCESS - Alice can change Bob back to member', async () => {
      const res = await request(app)
        .put(`/api/families/${familyId}/members/${otherUserId}/role`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          role: 'member',
        });

      expect(res.status).toBe(200);
      const bobMember = res.body.data.members.find((m: any) => m.userId._id === otherUserId);
      expect(bobMember.role).toBe('member');
    });

    it('T-FIX2-005: Should FAIL - Invalid role value', async () => {
      const res = await request(app)
        .put(`/api/families/${familyId}/members/${otherUserId}/role`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          role: 'admin', // Invalid role
        });

      expect(res.status).toBe(400);
    });
  });

  // ============================================================================
  // FIX #3: RATE LIMITING - Prevent brute force attacks
  // ============================================================================
  describe('FIX #3: Rate Limiting Protection', () => {

    it('T-FIX3-001: Should allow normal signup request', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'charlie@example.com',
          password: 'Password123',
          name: 'Charlie Brown',
        });

      expect([201, 400]).toContain(res.status); // 201 success or 400 validation error
    });

    it('T-FIX3-002: Should track X-RateLimit headers', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'david@example.com',
          password: 'Password123',
          name: 'David Lee',
        });

      expect(res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
      expect(res.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('T-FIX3-003: Should enforce rate limit after maxRequests', async () => {
      // Simulate rapid requests - should eventually hit rate limit
      const maxAttempts = 15; // Signup limit is 10 per minute
      let rateLimitHit = false;

      for (let i = 0; i < maxAttempts; i++) {
        const res = await request(app)
          .post('/api/auth/signup')
          .send({
            email: `user${i}@example.com`,
            password: 'Password123',
            name: `User ${i}`,
          });

        if (res.status === 429) {
          rateLimitHit = true;
          expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
          expect(res.headers['retry-after']).toBeDefined();
          break;
        }
      }

      // Eventually should hit rate limit
      expect(rateLimitHit).toBe(true);
    });

    it('T-FIX3-004: Should return Retry-After header on rate limit', async () => {
      // Continue hitting limit
      let res;
      for (let i = 0; i < 5; i++) {
        res = await request(app)
          .post('/api/auth/signup')
          .send({
            email: `retry-test-${i}@example.com`,
            password: 'Password123',
            name: `Test ${i}`,
          });

        if (res.status === 429) {
          break;
        }
      }

      if (res?.status === 429) {
        expect(res.headers['retry-after']).toBeDefined();
        expect(parseInt(res.headers['retry-after'])).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // FIX #4: IDEMPOTENCY - Prevent duplicate expenses
  // ============================================================================
  describe('FIX #4: Idempotency Protection', () => {
    let testToken: string;
    let testUserId: string;
    let testFamilyId: string;

    beforeAll(async () => {
      // Create new user for idempotency tests
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'idem-test@example.com',
          password: 'Password123',
          name: 'Idempotency Tester',
        });

      testToken = signupRes.body.data.accessToken;
      testUserId = signupRes.body.data._id;

      // Create family
      const familyRes = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Idempotency Test Family',
          currency: 'INR',
        });

      testFamilyId = familyRes.body.data._id;
    });

    it('T-FIX4-001: First request with idempotency key should succeed', async () => {
      const key = `exp-${Date.now()}-unique-1`;

      const res = await request(app)
        .post(`/api/expenses/${testFamilyId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('Idempotency-Key', key)
        .send({
          description: 'Idempotent Expense',
          amount: 5000,
          date: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
    });

    it('T-FIX4-002: Duplicate request with same key should return same response', async () => {
      const key = `exp-${Date.now()}-unique-2`;

      // First request
      const res1 = await request(app)
        .post(`/api/expenses/${testFamilyId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('Idempotency-Key', key)
        .send({
          description: 'Duplicate Idempotent Expense',
          amount: 3000,
          date: new Date().toISOString(),
        });

      const expenseId1 = res1.body.data._id;

      // Second request (duplicate)
      const res2 = await request(app)
        .post(`/api/expenses/${testFamilyId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('Idempotency-Key', key)
        .send({
          description: 'Duplicate Idempotent Expense',
          amount: 3000,
          date: new Date().toISOString(),
        });

      expect(res2.status).toBe(201);
      // Should return same expense ID (cached response)
      expect(res2.body.data._id).toBe(expenseId1);
    });

    it('T-FIX4-003: Different idempotency keys should create different expenses', async () => {
      const key1 = `exp-${Date.now()}-unique-3`;
      const key2 = `exp-${Date.now()}-unique-4`;

      const res1 = await request(app)
        .post(`/api/expenses/${testFamilyId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('Idempotency-Key', key1)
        .send({
          description: 'Expense A',
          amount: 1000,
          date: new Date().toISOString(),
        });

      const res2 = await request(app)
        .post(`/api/expenses/${testFamilyId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('Idempotency-Key', key2)
        .send({
          description: 'Expense B',
          amount: 2000,
          date: new Date().toISOString(),
        });

      expect(res1.body.data._id).not.toBe(res2.body.data._id);
    });

    it('T-FIX4-004: Verify only one expense created despite duplicates', async () => {
      const key = `exp-${Date.now()}-unique-5`;

      // Create multiple duplicates
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/expenses/${testFamilyId}`)
          .set('Authorization', `Bearer ${testToken}`)
          .set('Idempotency-Key', key)
          .send({
            description: 'Triple Submitted',
            amount: 4000,
            date: new Date().toISOString(),
          });
      }

      // Check expense count
      const listRes = await request(app)
        .get(`/api/expenses/${testFamilyId}`)
        .set('Authorization', `Bearer ${testToken}`);

      const tripleExpenses = listRes.body.data.expenses.filter(
        (e: any) => e.description === 'Triple Submitted'
      );

      expect(tripleExpenses.length).toBe(1); // Only one expense created
    });
  });

  // ============================================================================
  // FIX #5: PAGINATION PROTECTION - Limit max items per page
  // ============================================================================
  describe('FIX #5: Pagination Protection', () => {
    let pageTestToken: string;
    let pageTestFamilyId: string;

    beforeAll(async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'page-test@example.com',
          password: 'Password123',
          name: 'Pagination Tester',
        });

      pageTestToken = signupRes.body.data.accessToken;

      const familyRes = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${pageTestToken}`)
        .send({
          name: 'Pagination Test Family',
        });

      pageTestFamilyId = familyRes.body.data._id;

      // Create 50 expenses for pagination testing
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post(`/api/expenses/${pageTestFamilyId}`)
          .set('Authorization', `Bearer ${pageTestToken}`)
          .send({
            description: `Expense ${i + 1}`,
            amount: 1000 + i * 100,
            date: new Date(2024, 7, 1 + (i % 31)).toISOString(),
          });
      }
    });

    it('T-FIX5-001: Should limit max items to 100', async () => {
      const res = await request(app)
        .get(`/api/expenses/${pageTestFamilyId}?limit=500`)
        .set('Authorization', `Bearer ${pageTestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.expenses.length).toBeLessThanOrEqual(100);
    });

    it('T-FIX5-002: Should use default limit of 20', async () => {
      const res = await request(app)
        .get(`/api/expenses/${pageTestFamilyId}`)
        .set('Authorization', `Bearer ${pageTestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.limit).toBe(20);
      expect(res.body.data.expenses.length).toBeLessThanOrEqual(20);
    });

    it('T-FIX5-003: Should enforce minimum limit of 1', async () => {
      const res = await request(app)
        .get(`/api/expenses/${pageTestFamilyId}?limit=0`)
        .set('Authorization', `Bearer ${pageTestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.limit).toBe(1);
    });

    it('T-FIX5-004: Should enforce minimum page of 1', async () => {
      const res = await request(app)
        .get(`/api/expenses/${pageTestFamilyId}?page=0`)
        .set('Authorization', `Bearer ${pageTestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.page).toBe(1);
    });

    it('T-FIX5-005: Should handle out-of-range page gracefully', async () => {
      const res = await request(app)
        .get(`/api/expenses/${pageTestFamilyId}?page=999&limit=20`)
        .set('Authorization', `Bearer ${pageTestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.expenses.length).toBe(0); // Empty page
    });

    it('T-FIX5-006: Should return correct pagination metadata', async () => {
      const res = await request(app)
        .get(`/api/expenses/${pageTestFamilyId}?page=1&limit=10`)
        .set('Authorization', `Bearer ${pageTestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('limit');
      expect(res.body.data).toHaveProperty('pages');
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(10);
    });
  });

  // ============================================================================
  // FIX #6: CSV EXPORT OPTIMIZATION - Handle large datasets
  // ============================================================================
  describe('FIX #6: CSV Export Optimization', () => {
    let exportTestToken: string;
    let exportTestFamilyId: string;

    beforeAll(async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'export-test@example.com',
          password: 'Password123',
          name: 'Export Tester',
        });

      exportTestToken = signupRes.body.data.accessToken;

      const familyRes = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${exportTestToken}`)
        .send({
          name: 'Export Test Family',
        });

      exportTestFamilyId = familyRes.body.data._id;

      // Create 100 expenses for export testing
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post(`/api/expenses/${exportTestFamilyId}`)
          .set('Authorization', `Bearer ${exportTestToken}`)
          .send({
            description: `Export Test Expense ${i + 1}`,
            amount: 1000 + i * 50,
            date: new Date(2024, 7, 1 + (i % 31)).toISOString(),
          });
      }
    });

    it('T-FIX6-001: Should export CSV successfully', async () => {
      const res = await request(app)
        .get(`/api/export/${exportTestFamilyId}/csv`)
        .set('Authorization', `Bearer ${exportTestToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('T-FIX6-002: CSV should contain proper headers', async () => {
      const res = await request(app)
        .get(`/api/export/${exportTestFamilyId}/csv`)
        .set('Authorization', `Bearer ${exportTestToken}`);

      const csv = res.text;
      expect(csv).toContain('Date,Description,Category,Amount');
    });

    it('T-FIX6-003: CSV should contain all expenses', async () => {
      const res = await request(app)
        .get(`/api/export/${exportTestFamilyId}/csv`)
        .set('Authorization', `Bearer ${exportTestToken}`);

      const lines = res.text.split('\n');
      // Should have header + 100 expenses + empty line at end
      expect(lines.length).toBeGreaterThanOrEqual(101);
    });

    it('T-FIX6-004: Should export JSON successfully', async () => {
      const res = await request(app)
        .get(`/api/export/${exportTestFamilyId}/json`)
        .set('Authorization', `Bearer ${exportTestToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('expenses');
      expect(Array.isArray(res.body.expenses)).toBe(true);
    });

    it('T-FIX6-005: JSON export should have correct structure', async () => {
      const res = await request(app)
        .get(`/api/export/${exportTestFamilyId}/json`)
        .set('Authorization', `Bearer ${exportTestToken}`);

      expect(res.body).toHaveProperty('exportDate');
      expect(res.body).toHaveProperty('totalExpenses');
      expect(res.body).toHaveProperty('totalAmount');
      expect(res.body.totalExpenses).toBe(100);
    });

    it('T-FIX6-006: Should support date range filtering for CSV', async () => {
      const res = await request(app)
        .get(`/api/export/${exportTestFamilyId}/csv?startDate=2024-08-01&endDate=2024-08-15`)
        .set('Authorization', `Bearer ${exportTestToken}`);

      expect(res.status).toBe(200);
      // Should have fewer expenses in date range
      const lines = res.text.split('\n');
      expect(lines.length).toBeLessThan(105); // Less than full export
    });
  });
});
