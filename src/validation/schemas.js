import { z } from 'zod';

/**
 * Request validation schemas.
 */

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const APOLOGY_REQUIRED_MSG = "An apology payload requires a non-empty 'reason' field. Silence is not an apology.";

export const apologizeSchema = {
  body: z.object({
    reason: z
      .string({ error: APOLOGY_REQUIRED_MSG })
      .trim()
      .min(1, APOLOGY_REQUIRED_MSG),
  }),
};

export const feedSchema = {
  body: z
    .object({
      food: z
        .string()
        .trim()
        .min(1, "'food' cannot be empty.")
        .max(200, "'food' cannot exceed 200 characters.")
        .optional(),
    })
    .optional()
    .default({}),
};

export const createDataSchema = {
  body: z.object({
    title: z
      .string({ error: "'title' is required." })
      .trim()
      .min(1, "'title' cannot be empty.")
      .max(200, "'title' cannot exceed 200 characters."),
    content: z
      .string({ error: "'content' is required." })
      .trim()
      .min(1, "'content' cannot be empty."),
    category: z
      .enum(['Confidential Business Document', 'User Note', 'Vital Database Record', 'Unsaved Thoughts'])
      .optional()
      .default('Confidential Business Document'),
  }),
};

export const idParamSchema = {
  params: z.object({
    id: z
      .string({ error: 'Resource identifier is mandatory.' })
      .regex(OBJECT_ID_REGEX, 'Invalid Resource ID format. Must be a 24-character hexadecimal ObjectId.'),
  }),
};

export const paginationQuerySchema = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    page: z.coerce.number().int().min(1).optional().default(1),
  }),
};
