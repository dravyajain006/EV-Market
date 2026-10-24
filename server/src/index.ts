import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/db.js';

const PORT = parseInt(env.PORT, 10) || 5000;

async function bootstrap() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Connected to SQLite/PostgreSQL Database via Prisma');

    const server = app.listen(PORT, () => {
      console.log(`🚀 EV Market Analysis API Server listening at http://localhost:${PORT}`);
      console.log(`📡 Base API Route: http://localhost:${PORT}${env.API_PREFIX}`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
    });

    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('⚡ Prisma disconnected. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
