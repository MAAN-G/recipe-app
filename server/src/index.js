import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mealdbRouter from './routes/mealdb.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// Enable CORS for the Vite dev server and production client
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.CLIENT_ORIGIN,
    ].filter(Boolean),
    methods: ['GET'],
  })
);

// Gzip compression for responses
app.use(compression());

// Parse JSON bodies (not strictly needed for a proxy, but good practice)
app.use(express.json());

// Mount all MealDB proxy routes under /api
app.use('/api', mealdbRouter);

// Simple health-check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler — never leaks stack traces to clients
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Recipe proxy server running on http://localhost:${PORT}`);
});
