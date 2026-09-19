import express from 'express';
import { getData, createData, deleteData } from '../controllers/dataController.js';
import { validate } from '../middleware/validate.js';
import { createDataSchema, idParamSchema, paginationQuerySchema } from '../validation/schemas.js';

const router = express.Router();

router.get('/', validate(paginationQuerySchema), getData);
router.post('/', validate(createDataSchema), createData);
router.delete('/:id', validate(idParamSchema), deleteData);

export default router;
