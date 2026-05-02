import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { initializeSocket } from './services/socket.js';

const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize socket handlers
initializeSocket(io);

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 WhatsApp Clone Backend Server                       ║
║                                                           ║
║   Server running on: http://localhost:${config.port}           ║
║   Environment: ${config.nodeEnv.padEnd(31)}║
║                                                           ║
║   API Endpoints:                                         ║
║   • Auth:      /api/auth                                  ║
║   • Users:     /api/users                                 ║
║   • Chats:     /api/chats                                 ║
║   • Messages:  /api/messages                               ║
║   • Media:     /api/media                                 ║
║                                                           ║
║   WebSocket:  Ready for connections                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { httpServer, io };
