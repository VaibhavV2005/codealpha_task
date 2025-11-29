import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken } from '../auth.js';

export const authRouter = express.Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash });
  const token = generateToken(user);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(user);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});