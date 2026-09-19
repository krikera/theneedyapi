import rateLimit from 'express-rate-limit';

const createLimiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
  });

export const globalLimiter = createLimiter(200, {
  error: 'Too many requests. Please give DB-Gotchi a moment to breathe.',
  retryAfterMinutes: 15,
});

export const apologyLimiter = createLimiter(30, {
  error: 'Excessive contrition attempts detected. Stop spamming apologies; let your remorse settle.',
});

export const feedLimiter = createLimiter(60, {
  error: 'Feeding velocity exceeded. Overfeeding can lead to digital indigestion.',
});
