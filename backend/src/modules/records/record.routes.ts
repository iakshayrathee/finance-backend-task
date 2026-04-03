import { Router } from 'express';
import { recordController } from './record.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validateBody, validateQuery } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { Role } from '../../types';
import { CreateRecordDto, UpdateRecordDto, ListRecordsQueryDto } from './record.dto';

const router = Router();

// All record routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial record management
 */

/**
 * @swagger
 * /records:
 *   get:
 *     summary: List financial records with filters and pagination
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search on notes + category
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount]
 *           default: date
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of financial records
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  validateQuery(ListRecordsQueryDto),
  asyncHandler(recordController.listRecords)
);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get a single financial record by ID
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record found
 *       404:
 *         description: Record not found (or soft-deleted)
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  asyncHandler(recordController.getRecordById)
);

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a new financial record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: string
 *                 pattern: '^\d+(\.\d{1,2})?$'
 *                 example: "1500.00"
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 example: Salary
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 *       403:
 *         description: Insufficient permissions (VIEWER cannot create)
 *       422:
 *         description: Validation error
 */
router.post(
  '/',
  authorize(Role.ANALYST, Role.ADMIN),
  validateBody(CreateRecordDto),
  asyncHandler(recordController.createRecord)
);

/**
 * @swagger
 * /records/{id}:
 *   patch:
 *     summary: Update a financial record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Record updated
 *       403:
 *         description: Insufficient permissions (VIEWER cannot update)
 *       404:
 *         description: Record not found
 *       422:
 *         description: Validation error
 */
router.patch(
  '/:id',
  authorize(Role.ANALYST, Role.ADMIN),
  validateBody(UpdateRecordDto),
  asyncHandler(recordController.updateRecord)
);

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Soft-delete a financial record (sets isDeleted = true)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record soft-deleted
 *       403:
 *         description: Insufficient permissions (only ADMIN can delete)
 *       404:
 *         description: Record not found
 */
router.delete(
  '/:id',
  authorize(Role.ADMIN),
  asyncHandler(recordController.deleteRecord)
);

export default router;
