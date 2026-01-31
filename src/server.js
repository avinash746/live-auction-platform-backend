require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const { initializeSocketHandlers } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Configuration
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// CORS Configuration
const corsOptions = {
  origin: CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Auction Platform API',
    version: '1.0.0',
    endpoints: {
      items: '/api/items',
      time: '/api/time',
      health: '/api/health'
    }
  });
});

// Socket.io Configuration
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize Socket.io handlers
initializeSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`   Auction Platform Backend`);
  console.log('   ================================');
  console.log(`   🌐 Server: http://localhost:${PORT}`);
  console.log(`   🔌 Socket.io: Ready for connections`);
  console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   📡 CORS Origin: ${CORS_ORIGIN}`);
  console.log('   ================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };