import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { globalLimiter } from './middleware/rateLimiter.js';
import { abandonmentMiddleware } from './middleware/abandonmentMiddleware.js';
import petRoutes from './routes/petRoutes.js';
import dataRoutes from './routes/dataRoutes.js';

import { openApiSpec, renderDocsHtml } from './docs/openapi.js';

const app = express();

// Security headers and rate limiting
app.use(helmet({
  contentSecurityPolicy: false, // Allows Scalar documentation bundle from CDN
}));
// CORS Configuration (before rate limiter so preflight OPTIONS requests are handled smoothly)
const parseCorsOrigin = () => {
  const envOrigin = process.env.CORS_ORIGIN;
  if (!envOrigin || envOrigin.trim() === '*' || envOrigin.trim() === '') {
    return '*';
  }
  const list = envOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  if (list.includes('*')) {
    return '*';
  }
  return (origin, callback) => {
    if (
      !origin ||
      list.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  };
};

app.use(
  cors({
    origin: parseCorsOrigin(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// OpenAPI Documentation & Root Overview (Exempt from abandonment interceptor)
app.get('/docs.json', (req, res) => res.status(200).json(openApiSpec));
app.get('/docs', (req, res) => res.status(200).type('html').send(renderDocsHtml()));

app.get('/', (req, res) => {
  res.status(200).json({
    project: 'The Needy API (DB-Gotchi)',
    tagline: 'An affective digital companion with severe abandonment issues.',
    status: 'Operational (or sullen, depending on how long you left me alone)',
    documentation: {
      interactiveDocs: 'GET /docs',
      openApiSpec: 'GET /docs.json',
      checkStatus: 'GET /api/status',
      feedPet: 'POST /api/feed',
      apologizeToPet: 'POST /api/apologize',
      readGrudges: 'GET /api/grudges',
      accessDataPantry: 'GET /api/data',
      addDataToPantry: 'POST /api/data',
    },
  });
});

// Abandonment interceptor
app.use(abandonmentMiddleware);

// Routes
app.use('/api', petRoutes);
app.use('/api/data', dataRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Resource Not Found. Are you ignoring my actual endpoints now too?',
  });
});

// Centralized Error handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED-EXCEPTION]', err);
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: 'Internal Server Breakdown: Emotional capacity exceeded.',
    ...(isProduction ? {} : { details: err.message, stack: err.stack }),
  });
});

export default app;
