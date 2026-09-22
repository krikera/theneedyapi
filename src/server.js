import 'dotenv/config';
import http from 'node:http';
import process from 'node:process';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { startHungerDaemon, stopHungerDaemon } from './services/hungerService.js';

const PORT = process.env.PORT || 3000;

// Process error traps
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

const startServer = async () => {
  await connectDB();
  startHungerDaemon();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    const abandonmentSec = (parseInt(process.env.ABANDONMENT_THRESHOLD_MS, 10) || 86400000) / 1000;
    const tickSec = (parseInt(process.env.HUNGER_TICK_INTERVAL_MS, 10) || 10800000) / 1000;

    console.log(`
===================================================
  The Needy API (DB-Gotchi) v1.0.0
===================================================
  Listening on:          http://localhost:${PORT}
  Abandonment Threshold: ${abandonmentSec}s
  Metabolic Tick:        ${tickSec}s
  Notice: Do not leave this server unattended.
===================================================
    `);
  });

  // Graceful shutdown
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    // Safety timeout: force kill after 10 seconds if connections hang
    const forceExitTimeout = setTimeout(() => {
      console.error('Shutdown deadline exceeded. Forcing termination.');
      process.exit(1);
    }, 10000);
    forceExitTimeout.unref();

    // 1. Stop hunger timer
    stopHungerDaemon();

    // 2. Close HTTP server
    server.close(async () => {
      console.log('HTTP server closed.');

      try {
        // 3. Disconnect MongoDB cleanly
        await disconnectDB();
        console.log('MongoDB disconnected.');
        process.exit(0);
      } catch (err) {
        console.error('Error disconnecting MongoDB:', err.message);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
