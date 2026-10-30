import jwt from 'jsonwebtoken';
export default function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try { const payload = jwt.verify(token, process.env.JWT_SECRET); req.userId = payload.sub; next(); }
  catch { return res.status(401).json({ message: 'Your session expired. Please sign in again.' }); }
}
