import { Router, Response } from 'express';
import { Category } from '../models/Category';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';
import { validateObjectId } from '../utils/idValidator';

const router = Router();

// ISSUE #8: Fix N+1 query problem by using single aggregation query
// Get all main categories with subcategories
router.get('/', async (_req: AuthRequest, res: Response): Promise<any> => {
  try {
    // Use aggregation to fetch all levels in a single query
    const categoriesWithSubs = await Category.aggregate([
      {
        $match: { level: 1, isActive: true },
      },
      {
        $sort: { order: 1 },
      },
      {
        $lookup: {
          from: 'categories',
          let: { parentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$parentId', '$$parentId'] },
                level: 2,
                isActive: true,
              },
            },
            { $sort: { order: 1 } },
            {
              $lookup: {
                from: 'categories',
                let: { parentId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$parentId', '$$parentId'] },
                      level: 3,
                      isActive: true,
                    },
                  },
                  { $sort: { order: 1 } },
                ],
                as: 'children',
              },
            },
          ],
          as: 'children',
        },
      },
    ]);

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

// ISSUE #8: Fix N+1 query problem by using single aggregation query
// Get flat list of all categories for simple dropdowns
router.get('/flat', async (_req: AuthRequest, res: Response): Promise<any> => {
  try {
    // Use aggregation to fetch all levels with parent names in a single query
    const categories = await Category.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $sort: { level: 1, order: 1 },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'parentId',
          foreignField: '_id',
          as: 'parentDetails',
        },
      },
      {
        $unwind: {
          path: '$parentDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          icon: 1,
          color: 1,
          level: 1,
          order: 1,
          parentId: 1,
          isActive: 1,
          parentName: { $ifNull: ['$parentDetails.name', null] },
        },
      },
    ]);

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'CATEGORY_FETCH_ERROR', message: 'Failed to fetch categories' },
    });
  }
});

// ISSUE #7: Add ObjectId validation for route parameters
// Get single category with all details
router.get('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    // ISSUE #7: Validate ObjectId before querying
    validateObjectId(req.params.id, 'categoryId');

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
  } catch (error: any) {
    // Check if it's our validation error
    if (error.code === 'INVALID_ID') {
      return res.status(error.statusCode || 400).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: 'CATEGORY_FETCH_ERROR', message: 'Failed to fetch category' },
    });
  }
});

export default router;
