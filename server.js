const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const receivedStockRoutes = require('./routes/recievedStockRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const cors = require('cors');

dotenv.config({ path: './.env' });

const app = express();

// Enhanced CORS configuration for development
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://31.97.70.39:3001',
    'http://31.97.70.39',
    'https://pos-frontend-topaz-three.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '20mb' }));

connectDB().then(() => console.log('Database connected'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/received-stocks', receivedStockRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});