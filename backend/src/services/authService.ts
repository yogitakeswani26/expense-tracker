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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('USER_EXISTS', 'User already exists', 400);
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      isVerified: true, // Auto-verify for demo
    });
    await user.save();

    // Create default family
    const family = new Family({
      name: `${name}'s Family`,
      ownerId: user._id,
      members: [{ userId: user._id, role: 'owner' }],
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    });
    await family.save();

    // Add family to user
    user.familyIds = [family._id];
    await user.save();

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: 'owner',
      familyId: family._id.toString(),
    });

    return { user: { id: user._id, email: user.email, name: user.name }, tokens };
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

    return { user: { id: user._id, email: user.email, name: user.name }, tokens };
  }

  async refreshToken(refreshToken: string) {
    const payload = verifyToken(refreshToken);
    if (!payload) {
      throw new AppError('INVALID_TOKEN', 'Invalid refresh token', 401);
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Remove exp and iat from payload before generating new tokens
    const { exp, iat, ...cleanPayload } = payload as any;
    const tokens = generateTokens(cleanPayload);
    return { tokens };
  }

  async getUserProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    return user;
  }

  async updateProfile(userId: string, updates: any) {
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    return user;
  }
}

export const authService = new AuthService();
