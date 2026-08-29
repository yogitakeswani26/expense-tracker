import { authService } from '../src/services/authService';
import { User } from '../src/models/User';
import { Family } from '../src/models/Family';

describe('Auth Service', () => {
  describe('signup', () => {
    it('should create a new user and default family', async () => {
      const result = await authService.signup('test@example.com', 'password123', 'Test User');

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should fail if user already exists', async () => {
      await authService.signup('existing@example.com', 'password123', 'Existing User');

      expect(
        async () => await authService.signup('existing@example.com', 'password123', 'Another User')
      ).rejects.toThrow('USER_EXISTS');
    });

    it('should validate email format', async () => {
      expect(
        async () => await authService.signup('invalid-email', 'password123', 'Test User')
      ).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should validate password length', async () => {
      expect(
        async () => await authService.signup('test@example.com', 'short', 'Test User')
      ).rejects.toThrow('VALIDATION_ERROR');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.signup('login@example.com', 'password123', 'Login User');
    });

    it('should login with correct credentials', async () => {
      const result = await authService.login('login@example.com', 'password123');

      expect(result.user.email).toBe('login@example.com');
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      expect(
        async () => await authService.login('login@example.com', 'wrongpassword')
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should fail with non-existent user', async () => {
      expect(
        async () => await authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });
  });
});
