import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validateQuery } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { Role } from '../../types';
import { TrendsQueryDto, RecentQueryDto } from './dashboard.dto';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and reporting — ANALYST + ADMIN only
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get financial summary (total income, expenses, net balance, count)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary totals
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalIncome:
 *                           type: string
 *                           example: "15000.00"
 *                         totalExpenses:
 *                           type: string
 *                           example: "8000.00"
 *                         netBalance:
 *                           type: string
 *                           example: "7000.00"
 *                         recordCount:
 *                           type: integer
 *                           example: 30
 *       403:
 *         description: Insufficient permissions
 */
router.get('/summary', authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN), asyncHandler(dashboardController.getSummary));

/**
 * @swagger
 * /dashboard/by-category:
 *   get:
 *     summary: Get totals grouped by category and transaction type
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [INCOME, EXPENSE]
 *                           total:
 *                             type: string
 *                           count:
 *                             type: integer
 */
router.get('/by-category', authorize(Role.ANALYST, Role.ADMIN), asyncHandler(dashboardController.getByCategory));

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Get income/expense trends grouped by month or week
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, weekly]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Trend data grouped by period
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                             example: "2024-01"
 *                           income:
 *                             type: string
 *                           expenses:
 *                             type: string
 *                           net:
 *                             type: string
 */
router.get(
  '/trends',
  authorize(Role.ANALYST, Role.ADMIN),
  validateQuery(TrendsQueryDto),
  asyncHandler(dashboardController.getTrends)
);

/**
 * @swagger
 * /dashboard/recent:
 *   get:
 *     summary: Get recent non-deleted financial records
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Recent records
 */
router.get(
  '/recent',
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  validateQuery(RecentQueryDto),
  asyncHandler(dashboardController.getRecent)
);

export default router;
