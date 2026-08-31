import { Request, Response, NextFunction } from 'express';
import { signupRateLimiter, loginRateLimiter, refreshRateLimiter, apiRateLimiter } from '../middleware/rateLimiter';

// Mock request and response
const createMockReqRes = (ip: string = '127.0.0.1') => {
  const req = {
    ip,
    headers: {},
  } as any as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  } as any as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, next };
};

describe('Rate Limiter', () => {
  describe('Signup Rate Limiter (10 requests per 60s)', () => {
    it('should allow first request', () => {
      const { req, res, next } = createMockReqRes('192.168.1.1');
      signupRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow 10 requests within window', () => {
      const { req, res, next } = createMockReqRes('192.168.1.2');
      for (let i = 0; i < 10; i++) {
        signupRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(i + 1);
      }
    });

    it('should block 11th request', () => {
      const { req, res, next } = createMockReqRes('192.168.1.3');
      for (let i = 0; i < 11; i++) {
        signupRateLimiter(req, res, next);
      }
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'TOO_MANY_REQUESTS' }),
        })
      );
    });
  });

  describe('Login Rate Limiter (5 requests per 60s)', () => {
    it('should allow first request', () => {
      const { req, res, next } = createMockReqRes('192.168.1.4');
      loginRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow 5 requests within window', () => {
      const { req, res, next } = createMockReqRes('192.168.1.5');
      for (let i = 0; i < 5; i++) {
        loginRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(i + 1);
      }
    });

    it('should block 6th request', () => {
      const { req, res, next } = createMockReqRes('192.168.1.6');
      for (let i = 0; i < 6; i++) {
        loginRateLimiter(req, res, next);
      }
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Refresh Rate Limiter (20 requests per 60s)', () => {
    it('should allow 20 requests', () => {
      const { req, res, next } = createMockReqRes('192.168.1.7');
      for (let i = 0; i < 20; i++) {
        refreshRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(i + 1);
      }
    });

    it('should block 21st request', () => {
      const { req, res, next } = createMockReqRes('192.168.1.8');
      for (let i = 0; i < 21; i++) {
        refreshRateLimiter(req, res, next);
      }
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('API Rate Limiter (60 requests per 60s)', () => {
    it('should allow 60 requests', () => {
      const { req, res, next } = createMockReqRes('192.168.1.9');
      for (let i = 0; i < 60; i++) {
        apiRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(i + 1);
      }
    });
  });

  describe('Rate Limit Headers', () => {
    it('should set correct headers on first request', () => {
      const { req, res, next } = createMockReqRes('192.168.1.10');
      loginRateLimiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(String)
      );
    });

    it('should set Retry-After header when rate limited', () => {
      const { req, res, next } = createMockReqRes('192.168.1.11');
      for (let i = 0; i < 6; i++) {
        loginRateLimiter(req, res, next);
      }

      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
    });
  });

  describe('Different IPs should have separate limits', () => {
    it('should track separate limits for different IPs', () => {
      const { req: req1, res: res1, next: next1 } = createMockReqRes('192.168.1.12');
      const { req: req2, res: res2, next: next2 } = createMockReqRes('192.168.1.13');

      // 5 requests from IP1 (should work)
      for (let i = 0; i < 5; i++) {
        loginRateLimiter(req1, res1, next1);
      }
      expect(next1).toHaveBeenCalledTimes(5);

      // 5 requests from IP2 (should also work - different IP)
      for (let i = 0; i < 5; i++) {
        loginRateLimiter(req2, res2, next2);
      }
      expect(next2).toHaveBeenCalledTimes(5);

      // 6th request from IP1 (should fail)
      loginRateLimiter(req1, res1, next1);
      expect(res1.status).toHaveBeenCalledWith(429);

      // 6th request from IP2 (should also fail - same IP)
      loginRateLimiter(req2, res2, next2);
      expect(res2.status).toHaveBeenCalledWith(429);
    });
  });
});
