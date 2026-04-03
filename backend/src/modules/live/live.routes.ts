import { Router } from 'express';
import { liveController } from './live.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

/**
 * GET /api/live/events
 * SSE stream of backend activity events.
 * Auth via query param: ?token=<accessToken>
 * (EventSource API cannot set Authorization headers)
 */
router.get('/events', authenticate, liveController.streamEvents);

export default router;
