/**
 * Vercel Serverless Function entry point.
 *
 * Vercel looks for files under /api and exposes them as serverless functions.
 * This file re-uses the Express app from /server/src but exports it as a
 * handler instead of calling app.listen() — Vercel manages the HTTP layer.
 *
 * Environment variables (set in Vercel dashboard):
 *   MEALDB_API_BASE  — https://www.themealdb.com/api/json/v1
 *   MEALDB_API_KEY   — 1  (or your paid key)
 *   CLIENT_ORIGIN    — https://your-app.vercel.app
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Import the router directly from the server source
// (Vercel bundles the whole repo, so relative paths work fine)
import mealdbRouter from '../server/src/routes/mealdb.js';

const app = express();

app.use(helmet());

app.use(
  cors({
    // In production CLIENT_ORIGIN will be the Vercel preview/production URL.
    // During local `vercel dev` it defaults to localhost.
    origin: [
      'http://localhost:5173',
      process.env.CLIENT_ORIGIN,
    ].filter(Boolean),
    methods: ['GET'],
  })
);

app.use(compression());
app.use(express.json());

app.use('/api', mealdbRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Export the Express app as the default serverless handler.
// Vercel automatically wraps it — do NOT call app.listen() here.
export default app;
