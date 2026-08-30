import { Family } from '../models/Family';
import { User } from '../models/User';
import { Expense } from '../models/Expense';
import { Transaction } from '../models/Transaction';
import { AppError } from '../middleware/errorHandler';

export class FamilyService {
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

  async updateFamily(familyId: string, updates: any) {
    const family = await Family.findByIdAndUpdate(familyId, updates, { new: true });
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }
    return family;
  }

  async addMember(familyId: string, userId: string, role: 'member' | 'viewer' = 'member') {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    const memberExists = family.members.some(m => m.userId.toString() === userId);
    if (memberExists) {
      throw new AppError('MEMBER_EXISTS', 'Member already in family', 400);
    }

    family.members.push({ userId: userId as any, role, joinedAt: new Date() });
    await family.save();

    const user = await User.findById(userId);
    if (user) {
      user.familyIds.push(family._id);
      await user.save();
    }

    return family.populate('members.userId');
  }

  async removeMember(familyId: string, userId: string) {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    family.members = family.members.filter(m => m.userId.toString() !== userId);
    await family.save();

    const user = await User.findById(userId);
    if (user) {
      user.familyIds = user.familyIds.filter(id => id.toString() !== familyId);
      await user.save();
    }

    return family;
  }

  async updateMemberRole(familyId: string, userId: string, role: 'owner' | 'member' | 'viewer') {
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    const member = family.members.find(m => m.userId.toString() === userId);
    if (!member) {
      throw new AppError('MEMBER_NOT_FOUND', 'Member not found', 404);
    }

    member.role = role;
    await family.save();

    return family.populate('members.userId');
  }

  async getWhoOwesWho(familyId: string) {
    const expenses = await Expense.find({
      familyId,
      splits: { $exists: true, $ne: [] },
    });

    const balances: any = {};

    expenses.forEach(expense => {
      const paidBy = expense.paidBy.toString();
      if (!balances[paidBy]) balances[paidBy] = {};

      expense.splits?.forEach(split => {
        const userId = split.userId.toString();
        if (userId !== paidBy) {
          if (!balances[userId]) balances[userId] = {};
          balances[userId][paidBy] = (balances[userId][paidBy] || 0) + split.amount;
        }
      });
    });

    return balances;
  }

  async settleTransaction(familyId: string, fromUserId: string, toUserId: string, amount: number) {
    const transaction = new Transaction({
      familyId,
      fromUser: fromUserId,
      toUser: toUserId,
      amount,
      status: 'settled',
      settledAt: new Date(),
    });

    await transaction.save();
    return transaction;
  }
}

export const familyService = new FamilyService();
