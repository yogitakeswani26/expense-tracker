/**
 * autoCategorizationService.ts
 * ---------------------------------------------------------------------------
 * FEATURE 4 (Automation): Auto-categorization improvement
 *  - keyword/merchant rule pass (fast, works with zero history)
 *  - lightweight learned pass: a Naive-Bayes-style token classifier trained
 *    on the family's own historically categorized expenses, so suggestions
 *    improve automatically as the family uses the app
 *  - bulk review helper to (optionally) reclassify a backlog of
 *    miscellaneous/uncategorized expenses
 */

import mongoose from 'mongoose';
import { Expense } from '../models/Expense';
import { AppError } from '../middleware/errorHandler';

// Extend freely. Within a category, list more specific keywords first — the
// longest match wins ties on confidence.
const KEYWORD_RULES: Record<string, string[]> = {
  'Food & Dining': ['restaurant', 'swiggy', 'zomato', 'cafe', 'coffee', 'starbucks', 'dominos', 'pizza', 'mcdonald', 'kfc', 'dining', 'bakery'],
  Groceries: ['grocery', 'groceries', 'supermarket', 'bigbasket', 'blinkit', 'zepto', 'dmart', 'kirana'],
  Transport: ['uber', 'ola', 'rapido', 'taxi', 'cab', 'fuel', 'petrol', 'diesel', 'metro', 'bus fare', 'parking', 'toll'],
  Utilities: ['electricity', 'water bill', 'gas bill', 'broadband', 'wifi', 'internet bill', 'dth', 'mobile recharge', 'phone bill'],
  Housing: ['rent', 'maintenance', 'society charges', 'home loan emi'],
  Entertainment: ['netflix', 'spotify', 'prime video', 'hotstar', 'movie', 'cinema', 'pvr', 'inox', 'youtube premium', 'gaming'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'clothing', 'shoes'],
  Health: ['pharmacy', 'medicine', 'hospital', 'doctor', 'clinic', 'apollo', 'medplus', 'insurance premium'],
  Travel: ['flight', 'hotel', 'airbnb', 'makemytrip', 'goibibo', 'irctc', 'train ticket', 'vacation'],
  Education: ['tuition', 'course', 'udemy', 'coursera', 'school fee', 'college fee', 'textbooks'],
  Subscriptions: ['subscription', 'membership', 'annual plan', 'renewal'],
};

export interface CategorySuggestion {
  category: string;
  confidence: number; // 0-1
  reason: string;
}

export class AutoCategorizationService {
  private keywordMatch(description: string): CategorySuggestion[] {
    const text = description.toLowerCase();
    const hits: CategorySuggestion[] = [];

    for (const [category, keywords] of Object.entries(KEYWORD_RULES)) {
      const matched = keywords.filter((k) => text.includes(k));
      if (matched.length === 0) continue;

      const specificity = Math.max(...matched.map((k) => k.length));
      const confidence = Math.min(0.95, 0.5 + specificity / 30 + (matched.length - 1) * 0.05);
      hits.push({ category, confidence: Math.round(confidence * 100) / 100, reason: `matched "${matched[0]}"` });
    }

    return hits.sort((a, b) => b.confidence - a.confidence);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  /**
   * Builds a token -> category frequency table from the family's own expense
   * history (a minimal Naive Bayes-style model). Lets suggestions adapt to
   * merchants/phrasing the generic keyword dictionary doesn't know about.
   */
  async learnFromHistory(familyId: string): Promise<Map<string, Map<string, number>>> {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }

    const expenses = await Expense.find({ familyId }).select('description category').lean();

    const tokenCategoryFreq = new Map<string, Map<string, number>>();
    for (const exp of expenses) {
      for (const token of this.tokenize(exp.description)) {
        if (!tokenCategoryFreq.has(token)) tokenCategoryFreq.set(token, new Map());
        const catMap = tokenCategoryFreq.get(token)!;
        catMap.set(exp.category, (catMap.get(exp.category) || 0) + 1);
      }
    }

    return tokenCategoryFreq;
  }

  /** Combines keyword rules + the learned model into a ranked list of suggestions. */
  async suggestCategory(familyId: string, description: string, _amount?: number): Promise<CategorySuggestion[]> {
    const ruleHits = this.keywordMatch(description);

    let learnedHits: CategorySuggestion[] = [];
    try {
      const model = await this.learnFromHistory(familyId);
      const tokens = this.tokenize(description);
      const categoryScores = new Map<string, number>();
      let totalMatches = 0;

      for (const token of tokens) {
        const catMap = model.get(token);
        if (!catMap) continue;
        for (const [category, count] of catMap) {
          categoryScores.set(category, (categoryScores.get(category) || 0) + count);
          totalMatches += count;
        }
      }

      if (totalMatches > 0) {
        learnedHits = Array.from(categoryScores.entries())
          .map(([category, score]) => ({
            category,
            confidence: Math.round(Math.min(0.9, score / totalMatches) * 100) / 100,
            reason: 'based on your past categorization habits',
          }))
          .sort((a, b) => b.confidence - a.confidence);
      }
    } catch {
      // Learning pass is best-effort — keyword rules still apply if it fails (e.g. DB hiccup)
    }

    // Merge: where rule-based and learned agree on a category, boost confidence.
    const merged = new Map<string, CategorySuggestion>();
    for (const hit of [...ruleHits, ...learnedHits]) {
      const existing = merged.get(hit.category);
      if (existing) {
        existing.confidence = Math.round(Math.min(0.98, existing.confidence + hit.confidence * 0.3) * 100) / 100;
        existing.reason += ` + ${hit.reason}`;
      } else {
        merged.set(hit.category, { ...hit });
      }
    }

    const results = Array.from(merged.values()).sort((a, b) => b.confidence - a.confidence);
    return results.length > 0 ? results.slice(0, 3) : [{ category: 'Miscellaneous', confidence: 0.2, reason: 'no strong match found' }];
  }

  /**
   * Reviews expenses sitting in a catch-all category (default: Miscellaneous)
   * and proposes a better category. Dry-run by default — pass applyChanges to
   * actually update the documents.
   */
  async suggestBulkRecategorization(familyId: string, categoryToReview = 'Miscellaneous', applyChanges = false) {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }

    const candidates = await Expense.find({ familyId, category: categoryToReview }).select('description category amount').lean();
    const results: { expenseId: any; description: string; from: string; suggested: string; confidence: number }[] = [];

    for (const exp of candidates) {
      const suggestions = await this.suggestCategory(familyId, exp.description, exp.amount);
      const best = suggestions[0];
      if (best && best.category !== categoryToReview && best.confidence >= 0.6) {
        results.push({ expenseId: exp._id, description: exp.description, from: categoryToReview, suggested: best.category, confidence: best.confidence });
        if (applyChanges) {
          await Expense.updateOne({ _id: exp._id }, { $set: { category: best.category, updatedAt: new Date() } });
        }
      }
    }

    return { reviewed: candidates.length, reclassified: results.length, applied: applyChanges, results };
  }
}

export const autoCategorizationService = new AutoCategorizationService();
