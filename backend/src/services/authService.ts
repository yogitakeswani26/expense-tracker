import { User } from '../models/User';
import { Family } from '../models/Family';
import { generateTokens, verifyToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { signupSchema, loginSchema } from '../utils/validators';

export class AuthService {
  async signup(email: string, password: string, name: string) {
    const validation = signupSchema.safeParse({ email, password, name });
    if (!validation.success) {
      throw new AppError('VALIDATION_ERROR', validation.error.issues[0].message, 400);
    }

    const session = await User.startSession();
    session.startTransaction();

    try {
      const user = new User({
        email: email.toLowerCase(),
        password,
        name,
        isVerified: true,
      });
      await user.save({ session });

      const family = new Family({
        name: `${name}'s Family`,
        ownerId: user._id,
        members: [{ userId: user._id, role: 'owner' }],
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      });
      await family.save({ session });

      user.familyIds = [family._id];
      await user.save({ session });

      await session.commitTransaction();

      const tokens = generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: 'owner',
        familyId: family._id.toString(),
      });

      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          familyId: family._id.toString()
        },
        tokens
      };
    } catch (error: any) {
      await session.abortTransaction();
      if (error.code === 11000) {
        throw new AppError('USER_EXISTS', 'Email already registered', 409);
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async login(email: string, password: string) {
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      throw new AppError('VALIDATION_ERROR', validation.error.issues[0].message, 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid credentials', 401);
    }

    const family = await Family.findOne({ 'members.userId': user._id });
    if (!family) {
      throw new AppError('NO_FAMILY', 'User has no family', 400);
    }

    const memberRole = family.members.find(m => m.userId.toString() === user._id.toString())?.role || 'member';

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: memberRole as any,
      familyId: family._id.toString(),
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        familyId: family._id.toString()
      },
      tokens
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new AppError('INVALID_TOKEN', 'Refresh token is required', 401);
    }

    try {
      const payload = verifyToken(refreshToken);
      if (!payload) {
        throw new AppError('INVALID_TOKEN', 'Token expired or invalid', 401);
      }

      const user = await User.findById(payload.userId);
      if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      const { exp, iat, ...cleanPayload } = payload as any;
      const tokens = generateTokens(cleanPayload);
      return { tokens };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Token refresh failed:', error.message);
      throw new AppError('INVALID_TOKEN', 'Invalid refresh token', 401);
    }
  }

  async getUserProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    return user;
  }

  async updateProfile(userId: string, updates: any) {
    // Whitelist allowed fields to prevent privilege escalation
    const allowedFields = ['name', 'currency', 'language', 'timezone', 'avatar'];
    const safeUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {});

    if (Object.keys(safeUpdates).length === 0) {
      throw new AppError('NO_UPDATES', 'No valid fields to update', 400);
    }

    const user = await User.findByIdAndUpdate(userId, safeUpdates, { new: true });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    return user;
  }
}

export const authService = new AuthService();
