import { ZodError } from 'zod';

/**
 * Request validation middleware using Zod schemas for body, params, and query.
 */

export const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    if (schema.query) {
      const parsed = schema.query.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues || [];
      const primaryIssue = issues[0];
      return res.status(400).json({
        error: primaryIssue ? primaryIssue.message : 'Validation failed.',
        details: issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};
