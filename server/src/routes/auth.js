import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
const router = Router();
const tokenFor = user => jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET || 'finora_secure_random_jwt_secret_key_84f93b2a1c0d4e5f6a7b8c9d0e1f2a3b', { expiresIn: '7d' });
router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim(); const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || '' } });
  } catch (e) { next(e); }
});
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || '' } });
  } catch (e) { next(e); }
});
router.put('/profile', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (req.body.avatar !== undefined) {
      user.avatar = String(req.body.avatar || '');
    }
    if (name) {
      if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
      user.name = name;
    }
    if (email && email !== user.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== user._id.toString()) return res.status(409).json({ message: 'An account with this email already exists.' });
      user.email = email;
    }
    if (password) {
      if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
      user.passwordHash = await bcrypt.hash(password, 12);
    }
    await user.save();
    const updatedUser = { id: user._id, name: user.name, email: user.email, avatar: user.avatar || '' };
    res.json({ message: 'Profile updated successfully.', user: updatedUser, token: tokenFor(user) });
  } catch (e) { next(e); }
});
export default router;

