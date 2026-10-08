/**
 * Server Entrypoint
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const app = require('./app');
const config = require('./config/env');
const { initializePool, getEngineType } = require('./config/database');

async function startServer() {
  try {
    // Initialize database pool
    initializePool();
    const engine = getEngineType();

    const server = app.listen(config.PORT, () => {
      console.log('========================================================');
      console.log(' TerraCraft Artisanal Ceramics - Backend Server');
      console.log(` Student: Kalpna Asnani (Roll No: 2k23/CSM/55)`);
      console.log(` University of Sindh, Jamshoro`);
      console.log('========================================================');
      console.log(` Port: ${config.PORT}`);
      console.log(` Environment: ${config.NODE_ENV}`);
      console.log(` Database Engine: ${engine}`);
      console.log(` Health Check: http://localhost:${config.PORT}/api/v1/health`);
      console.log('========================================================');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });

    return server;
  } catch (err) {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
