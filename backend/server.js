const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { cleanupExpiredReservations } = require('./utils/reservationHelper');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow API tools with no Origin header, and allow configured frontend URLs.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api', require('./routes/bookingRoutes'));

// Health check endpoint
app.get('/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date() 
  });
});
app.get('/', (req, res) => {
  res.json({ 
    "message":"BookNJoy Api is running"
  });
});
const PORT = process.env.PORT || 5000;
let mongoServer;

const startServer = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // Setup Mongo Memory Server if no URI is supplied in environment (zero-config local dev)
    if (!mongoUri) {
      console.log('------------------------------------------------------------');
      console.log('No MONGO_URI environment variable detected.');
      console.log('Launching in-memory MongoDB Server (MongoMemoryServer)...');
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log(`In-memory database initialized: ${mongoUri}`);
      console.log('------------------------------------------------------------');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connection established successfully.');

    // Auto-seed if database is empty (highly useful for zero-config runs)
    const { seedData } = require('./seed');
    const Event = require('./models/Event');
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      console.log('Database appears empty. Auto-running seeding script...');
      await seedData();
    }

    app.listen(PORT, () => {
      console.log(`Express server is listening on port ${PORT}`);
    });

    // Start background reservation garbage collector running every 10 seconds
    setInterval(async () => {
      await cleanupExpiredReservations();
    }, 10000);

  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
};

startServer();

// Handle graceful terminations
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  process.exit(0);
});
