import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import datasetsRoutes from './modules/datasets/datasets.routes.js';
import powerbiRoutes from './modules/powerbi/powerbi.routes.js';
import forecastRoutes from './modules/forecast/forecast.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

// Security and utility middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'ev-market-analysis-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// Mount Versioned REST API routes (/api/v1)
const api = express.Router();
api.use('/auth', authRoutes);
api.use('/analytics', analyticsRoutes);
api.use('/datasets', datasetsRoutes);
api.use('/powerbi', powerbiRoutes);
api.use('/forecasts', forecastRoutes);
api.use('/admin', adminRoutes);

app.use(env.API_PREFIX, api);

// 404 handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.url}' not found on this server`,
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
