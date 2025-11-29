import express from 'express';
import cors from 'cors';
import { sequelize } from './db.js';
import { Product } from './models/Product.js';
import { User } from './models/User.js';
import { Order } from './models/Order.js';
import { OrderItem } from './models/OrderItem.js';
import { productsRouter } from './routes/products.js';
import { authRouter } from './routes/authRoutes.js';
import { ordersRouter } from './routes/orders.js';

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);

// Serve frontend (static)
app.use('/', express.static('../frontend'));

const PORT = 4000;

// Initialize database and seed
async function init() {
  await sequelize.sync({ alter: true });

  const count = await Product.count();
  if (count === 0) {
    await Product.bulkCreate([
      { name: 'Blue T-Shirt', description: 'Comfort cotton tee', price: 499.00, stock: 50, imageUrl: 'https://via.placeholder.com/300x200?text=Blue+T-Shirt' },
      { name: 'Wireless Mouse', description: 'Ergonomic 2.4GHz', price: 899.00, stock: 30, imageUrl: 'https://via.placeholder.com/300x200?text=Wireless+Mouse' },
      { name: 'Notebook', description: 'A5 dotted, 120 pages', price: 199.00, stock: 100, imageUrl: 'https://via.placeholder.com/300x200?text=Notebook' }
    ]);
  }
}

init().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});