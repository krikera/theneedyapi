import express from 'express';
import { apologize, feed, getStatus, getGrudges } from '../controllers/petController.js';
import { validate } from '../middleware/validate.js';
import { apologizeSchema, feedSchema, paginationQuerySchema } from '../validation/schemas.js';
import { apologyLimiter, feedLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/apologize', apologyLimiter, validate(apologizeSchema), apologize);
router.post('/feed', feedLimiter, validate(feedSchema), feed);
router.get('/status', getStatus);
router.get('/grudges', validate(paginationQuerySchema), getGrudges);

export default router;
