import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import { runMigrations } from './db/migrate';
import { swaggerSpec } from './docs/swagger';
import db from './db';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use((req: Request, res: Response, next) => {
  if (req.originalUrl === '/v1/webhooks/paystack') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Swagger UI Endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs-json', (req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// API Router
app.use('/v1', apiRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: true, service: 'skrillpay-api', uptime: process.uptime() });
});

export async function startServer() {
  if (process.env.DATABASE_URL) {
    try {
      await runMigrations();
    } catch (err) {
      console.warn('⚠️ Automated DB migration on startup failed or skipped:', err);
    }
  }

  return app.listen(PORT, () => {
    console.log(`🚀 Paystack Payment Platform MVP API running on port ${PORT}`);
    console.log(`- Swagger UI Docs: http://localhost:${PORT}/docs`);
    console.log(`- Health Check: http://localhost:${PORT}/health`);
    console.log(`- Merchant Onboarding: POST http://localhost:${PORT}/v1/merchants/onboard`);
    console.log(`- Charge Endpoint: POST http://localhost:${PORT}/v1/charge`);
  });
}

// Only auto-start server if file is called directly (not imported during tests)
if (require.main === module) {
  startServer();
}

export default app;
