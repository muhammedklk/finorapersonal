import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import auth from '../middleware/auth.js';
import { sendOtpEmail } from '../utils/mailer.js';

const router = Router();
const tokenFor = user => jwt.sign(
  { sub: user._id.toString() }, 
  process.env.JWT_SECRET || 'finora_secure_random_jwt_secret_key_84f93b2a1c0d4e5f6a7b8c9d0e1f2a3b', 
  { expiresIn: '7d' }
);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Direct Register (kept for demo or non-OTP fallback)
router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || '' } });
  } catch (e) { next(e); }
});

// 2. Send Registration OTP
router.post('/register/send-otp', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing register OTPs for this email and save new one
    await Otp.deleteMany({ email, type: 'register' });
    await Otp.create({ email, otp, type: 'register', expiresAt });

    await sendOtpEmail(email, otp, 'register');
    res.json({ message: `Verification code sent to ${email}` });
  } catch (e) { next(e); }
});

// 3. Verify Registration OTP & Create Account
router.post('/register/verify-otp', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const otp = String(req.body.otp || '').trim();

    if (!otp) return res.status(400).json({ message: 'Please enter the verification code.' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });

    const otpRecord = await Otp.findOne({ email, otp, type: 'register', expiresAt: { $gt: new Date() } });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new code.' });
    }

    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    await Otp.deleteMany({ email, type: 'register' });

    res.status(201).json({ 
      token: tokenFor(user), 
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || '' },
      message: 'Account verified and created successfully!'
    });
  } catch (e) { next(e); }
});

// 4. Send Forgot Password OTP
router.post('/forgot-password/send-otp', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.deleteMany({ email, type: 'forgot_password' });
    await Otp.create({ email, otp, type: 'forgot_password', expiresAt });

    await sendOtpEmail(email, otp, 'forgot_password');
    res.json({ message: `Password reset code sent to ${email}` });
  } catch (e) { next(e); }
});

// 5. Verify Forgot Password OTP & Reset Password
router.post('/forgot-password/reset', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!otp) return res.status(400).json({ message: 'Please enter the reset code.' });
    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const otpRecord = await Otp.findOne({ email, otp, type: 'forgot_password', expiresAt: { $gt: new Date() } });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP code. Please request a new code.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    await Otp.deleteMany({ email, type: 'forgot_password' });

    res.json({ message: 'Password reset successfully! You can now sign in with your new password.' });
  } catch (e) { next(e); }
});

// 6. Login
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || '' } });
  } catch (e) { next(e); }
});

// 7. Profile Update
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
