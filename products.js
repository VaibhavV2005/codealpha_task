import express from 'express';
import { Product } from '../models/Product.js';

export const productsRouter = express.Router();

// GET /api/products (list)
productsRouter.get('/', async (req, res) => {
  const products = await Product.findAll({ order: [['id', 'ASC']] });
  res.json(products);
});

// GET /api/products/:id (details)
productsRouter.get('/:id', async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});