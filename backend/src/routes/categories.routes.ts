import { Router, Response } from 'express';
import { Category } from '../models/Category';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';

const router = Router();

// Get all main categories with subcategories
router.get('/', async (_req: AuthRequest, res: Response): Promise<any> => {
  try {
    const mainCategories = await Category.find({ level: 1, isActive: true })
      .sort({ order: 1 })
      .lean();

    const categoriesWithSubs = await Promise.all(
      mainCategories.map(async (main: any) => {
        const subcategories = await Category.find({
          parentId: main._id,
          level: 2,
          isActive: true,
        })
          .sort({ order: 1 })
          .lean();

        const subWithSubs = await Promise.all(
          subcategories.map(async (sub: any) => {
            const subSubs = await Category.find({
              parentId: sub._id,
              level: 3,
              isActive: true,
            })
              .sort({ order: 1 })
              .lean();

            return { ...sub, children: subSubs };
          })
        );

        return { ...main, children: subWithSubs };
      })
    );

    return res.json({
      success: true,
      data: categoriesWithSubs,
    });
  } catch (error: any) {
    console.error('Category fetch error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'CATEGORY_FETCH_ERROR', message: 'Failed to fetch categories' },
    });
  }
});

// Get flat list of all categories for simple dropdowns
router.get('/flat', async (_req: AuthRequest, res: Response): Promise<any> => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ level: 1, order: 1 })
      .lean();

    // Enrich with parent names
    const enriched = await Promise.all(
      categories.map(async (cat: any) => {
        if (cat.parentId) {
          const parent = await Category.findById(cat.parentId).lean();
          return {
            ...cat,
            parentName: parent?.name,
          };
        }
        return { ...cat, parentName: null };
      })
    );

    return res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'CATEGORY_FETCH_ERROR', message: 'Failed to fetch categories' },
    });
  }
});

// Get single category with all details
router.get('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const category = await Category.findById(req.params.id).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' },
      });
    }

    return res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'CATEGORY_FETCH_ERROR', message: 'Failed to fetch category' },
    });
  }
});

export default router;
