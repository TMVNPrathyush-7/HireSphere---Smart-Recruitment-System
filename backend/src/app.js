import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { initDatabase } from './common/database/index.js';
import { seedData } from './common/database/seed.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import jobsRoutes from './modules/jobs/jobs.routes.js';
import applicationsRoutes from './modules/applications/applications.routes.js';
import resumesRoutes from './modules/resumes/resumes.routes.js';
import interviewsRoutes from './modules/interviews/interviews.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import aiProxyRoutes from './modules/ai_proxy/ai_proxy.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize DB and ensure seed
initDatabase();
seedData();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static files for resumes and uploads
app.use('/uploads', express.static(config.uploadDir));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'HireSphere Backend API (Modular Monolith)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount modular monolith routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiProxyRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`🚀 HireSphere Backend API running on http://localhost:${config.port}`);
    console.log(`📡 AI Service proxy target: ${config.aiServiceUrl}`);
  });
}

export default app;
