import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signToken } from '../middleware/auth.js';

const router = Router();
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

router.post('/login', (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.status(400).json({ message: 'Укажите логин и пароль' });
  }
  if (login !== ADMIN_LOGIN) {
    return res.status(401).json({ message: 'Неверный логин или пароль' });
  }
  const ok = ADMIN_PASSWORD_HASH
    ? bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)
    : password === (process.env.ADMIN_PASSWORD || 'admin');
  if (!ok) {
    return res.status(401).json({ message: 'Неверный логин или пароль' });
  }
  const token = signToken({ login });
  res.json({ token });
});

export default router;
