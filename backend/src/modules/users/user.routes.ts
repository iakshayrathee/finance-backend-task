import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validateBody, validateQuery } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { Role } from '../../types';
import { UpdateUserDto, ListUsersQueryDto, CreateUserDto } from './user.dto';

const router = Router();

// All user routes require authentication + ADMIN role
router.use(authenticate, authorize(Role.ADMIN));

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *                 default: VIEWER
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 *       422:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', validateBody(CreateUserDto), asyncHandler(userController.createUser));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management — ADMIN only
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (paginated)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [VIEWER, ANALYST, ADMIN]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', validateQuery(ListUsersQueryDto), asyncHandler(userController.listUsers));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
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
 *         description: User found
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:id', asyncHandler(userController.getUserById));

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user's name, role, or status
 *     tags: [Users]
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
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions
 *       422:
 *         description: Validation error
 */
router.patch('/:id', validateBody(UpdateUserDto), asyncHandler(userController.updateUser));

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Soft-delete a user (sets status to INACTIVE)
 *     tags: [Users]
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
 *         description: User deactivated
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id', asyncHandler(userController.deleteUser));

export default router;
