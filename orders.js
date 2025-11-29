import express from 'express';
import { authMiddleware } from '../auth.js';
import { Order } from '../models/Order.js';
import { OrderItem } from '../models/OrderItem.js';
import { Product } from '../models/Product.js';
import { sequelize } from '../db.js';

export const ordersRouter = express.Router();

// POST /api/orders (checkout)
ordersRouter.post('/', authMiddleware, async (req, res) => {
  const { items, address } = req.body; // items: [{productId, quantity}]
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });

  await sequelize.transaction(async (t) => {
    // calculate total, check stock
    let total = 0;
    const detailed = [];
    for (const it of items) {
      const product = await Product.findByPk(it.productId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product || product.stock < it.quantity) throw new Error(`Insufficient stock for ${it.productId}`);
      const price = Number(product.price);
      total += price * it.quantity;
      detailed.push({ product, quantity: it.quantity, price });
    }

    const order = await Order.create({ userId: req.user.id, total, status: 'PENDING' }, { transaction: t });

    for (const d of detailed) {
      await OrderItem.create(
        { orderId: order.id, productId: d.product.id, quantity: d.quantity, price: d.price },
        { transaction: t }
      );
      await d.product.update({ stock: d.product.stock - d.quantity }, { transaction: t });
    }

    res.json({ orderId: order.id, total, address, status: 'PENDING' });
  }).catch((e) => res.status(400).json({ error: e.message }));
});

// GET /api/orders/my
ordersRouter.get('/my', authMiddleware, async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [{ model: OrderItem, include: [Product] }],
    order: [['id', 'DESC']]
  });
  res.json(orders);
});