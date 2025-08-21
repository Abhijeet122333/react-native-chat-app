import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config';

const r = Router();

r.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user = new User({ username, password });
    await user.save();
    const token = jwt.sign({ id: user._id, username }, config.jwtSecret, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username } });
  } catch (e: any) {
    if (e.code === 11000) return res.status(409).json({ error: 'Username taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

r.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user: any = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await user.compare(password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, username }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, username } });
});

export default r;
