import { Family } from '../models/Family';
import { User } from '../models/User';
import { Expense } from '../models/Expense';
import { Transaction } from '../models/Transaction';
import { AppError } from '../middleware/errorHandler';

export class FamilyService {
  async createFamily(userId: string, name: string, currency: string = 'INR', timezone: string = 'Asia/Kolkata') {
    const family = new Family({
      name,
      ownerId: userId,
      members: [{ userId: userId as any, role: 'owner', joinedAt: new Date() }],
      currency,
      timezone,
    });
    await family.save();

    const user = await User.findById(userId);
    if (user) {
      user.familyIds.push(family._id);
      await user.save();
    }

    return family.populate('members.userId');
  }

  async getUserFamilies(userId: string) {
    const families = await Family.find({
      'members.userId': userId,
    }).populate('members.userId');
    return families;
  }

  async getFamily(familyId: string) {
    const family = await Family.findById(familyId).populate('members.userId');
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }
    return family;
  }

  async updateFamily(familyId: string, currentUserId: string, updates: any) {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // AUTHORIZATION: Check if current user is family owner
    if (family.ownerId.toString() !== currentUserId) {
      throw new AppError('UNAUTHORIZED', 'Only family owner can update family', 403);
    }

    // VALIDATION: Don't allow updating members array directly
    if (updates.members || updates.ownerId) {
      throw new AppError('INVALID_UPDATE', 'Use dedicated endpoints to update members', 400);
    }

    const updated = await Family.findByIdAndUpdate(familyId, updates, { new: true }).populate('members.userId');
    return updated;
  }

  async addMember(familyId: string, currentUserId: string, userId: string, role: 'member' | 'viewer' = 'member') {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // AUTHORIZATION: Check if current user is family owner
    if (family.ownerId.toString() !== currentUserId) {
      throw new AppError('UNAUTHORIZED', 'Only family owner can add members', 403);
    }

    const memberExists = family.members.some(m => m.userId.toString() === userId);
    if (memberExists) {
      throw new AppError('MEMBER_EXISTS', 'Member already in family', 400);
    }

    // VALIDATION: Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      throw new AppError('USER_NOT_FOUND', 'User to add does not exist', 404);
    }

    family.members.push({ userId: userId as any, role, joinedAt: new Date() });
    await family.save();

    userToAdd.familyIds.push(family._id);
    await userToAdd.save();

    return family.populate('members.userId');
  }

  async removeMember(familyId: string, currentUserId: string, userId: string) {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // AUTHORIZATION: Check if current user is family owner
    if (family.ownerId.toString() !== currentUserId) {
      throw new AppError('UNAUTHORIZED', 'Only family owner can remove members', 403);
    }

    // VALIDATION: Can't remove owner
    if (family.ownerId.toString() === userId) {
      throw new AppError('INVALID_OPERATION', 'Cannot remove family owner', 400);
    }

    family.members = family.members.filter(m => m.userId.toString() !== userId);
    await family.save();

    const user = await User.findById(userId);
    if (user) {
      user.familyIds = user.familyIds.filter(id => id.toString() !== familyId);
      await user.save();
    }

    return family.populate('members.userId');
  }

  async updateMemberRole(familyId: string, currentUserId: string, userId: string, role: 'owner' | 'member' | 'viewer') {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // AUTHORIZATION: Check if current user is family owner
    if (family.ownerId.toString() !== currentUserId) {
      throw new AppError('UNAUTHORIZED', 'Only family owner can change member roles', 403);
    }

    const member = family.members.find(m => m.userId.toString() === userId);
    if (!member) {
      throw new AppError('MEMBER_NOT_FOUND', 'Member not found', 404);
    }

    // SECURITY: Prevent creating new owners - only one owner allowed
    if (role === 'owner' && family.ownerId.toString() !== userId) {
      throw new AppError('UNAUTHORIZED', 'Only one family owner is allowed. Cannot promote another member to owner.', 403);
    }

    member.role = role;
    await family.save();

    return family.populate('members.userId');
  }

  // ISSUE #4: Add userId parameter and verify authorization at service level
  async getWhoOwesWho(familyId: string, userId: string) {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // Verify user is family member
    const isMember = family.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('UNAUTHORIZED', 'User is not a family member', 403);
    }

    const expenses = await Expense.find({
      familyId,
      splits: { $exists: true, $ne: [] },
    });

    const balances: any = {};

    expenses.forEach(expense => {
      // ISSUE #3: Ensure consistent string conversion
      const paidBy = expense.paidBy.toString();
      if (!balances[paidBy]) balances[paidBy] = {};

      expense.splits?.forEach(split => {
        const splitUserId = split.userId.toString();
        if (splitUserId !== paidBy) {
          if (!balances[splitUserId]) balances[splitUserId] = {};
          balances[splitUserId][paidBy] = (balances[splitUserId][paidBy] || 0) + split.amount;
        }
      });
    });

    return balances;
  }

  // ISSUE #4: Add userId parameter and verify authorization at service level
  async getDashboardSummary(familyId: string, userId: string) {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // Verify user is family member
    const isMember = family.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('UNAUTHORIZED', 'User is not a family member', 403);
    }

    // This is a placeholder - actual dashboard logic should be in analytics service
    return { success: true };
  }

  // ISSUE #8, #10: Use MongoDB transaction for settlements
  async settleTransaction(familyId: string, userId: string, fromUserId: string, toUserId: string, amount: number) {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // Verify user is family member
    const isMember = family.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('UNAUTHORIZED', 'User is not a family member', 403);
    }

    // ISSUE #10: Use MongoDB session for transaction support
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
      const transaction = new Transaction({
        familyId,
        fromUser: fromUserId,
        toUser: toUserId,
        amount,
        status: 'settled',
        settledAt: new Date(),
      });

      await transaction.save({ session });
      await session.commitTransaction();
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const familyService = new FamilyService();
