import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import planningRoutes from './routes/planning.js';
import auth from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from process.cwd() or server directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
app.disable('x-powered-by');

// CORS configuration (allow requests from Vercel frontend or localhost)
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// Database connection caching for Vercel Serverless
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI || 'mongodb+srv://kmuhammed:Muhammed9656@cluster0.pc5tkcr.mongodb.net/finora?retryWrites=true&w=majority';
  const db = await mongoose.connect(uri);
  isConnected = db.connections[0].readyState === 1;
}

// Middleware to ensure DB is connected before handling any API request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ message: 'Database connection failed: ' + err.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/api/transactions', auth, transactionRoutes);
app.use('/api/planning', auth, planningRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: 'Please check the submitted values.' });
  res.status(500).json({ message: err.message || (process.env.NODE_ENV === 'production' ? 'Something went wrong.' : 'Server error. Check the server terminal and environment settings.') });
});

const port = process.env.PORT || 5001;

// Only start the HTTP listener if not running in a serverless environment like Vercel
if (!process.env.VERCEL) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be set to a random string of at least 32 characters.');
  }
  connectDB()
    .then(() => {
      app.listen(port, () => console.log(`Finora API listening on http://localhost:${port}`));
    })
    .catch((e) => {
      console.error('MongoDB connection failed:', e.message);
    });
}

export default app;
