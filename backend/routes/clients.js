import { Router } from 'express';
import { getDb, persist, dbGet, dbAll, dbRun } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const allowed = ['last_name', 'first_name', 'middle_name', 'phone', 'email'];

function pick(body) {
  const o = {};
  allowed.forEach((k) => { if (body[k] !== undefined) o[k] = body[k]; });
  return o;
}

router.get('/', (req, res) => {
  try {
    const database = getDb();
    const rows = dbAll(database, 'SELECT id, last_name, first_name, middle_name, phone, email, created_at FROM clients ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const database = getDb();
    const row = dbGet(database, 'SELECT id, last_name, first_name, middle_name, phone, email, created_at FROM clients WHERE id = ?', [Number(req.params.id)]);
    if (!row) return res.status(404).json({ message: 'Клиент не найден' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const body = pick(req.body);
    if (!body.last_name || !body.first_name) return res.status(400).json({ message: 'Укажите фамилию и имя' });
    const database = getDb();
    dbRun(database, 'INSERT INTO clients (last_name, first_name, middle_name, phone, email) VALUES (?, ?, ?, ?, ?)', [
      body.last_name,
      body.first_name || '',
      body.middle_name || null,
      body.phone || null,
      body.email || null,
    ]);
    const id = dbGet(database, 'SELECT last_insert_rowid() as id').id;
    persist();
    const row = dbGet(database, 'SELECT id, last_name, first_name, middle_name, phone, email, created_at FROM clients WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const database = getDb();
    const existing = dbGet(database, 'SELECT * FROM clients WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Клиент не найден' });
    const body = pick(req.body);
    database.run('UPDATE clients SET last_name=?, first_name=?, middle_name=?, phone=?, email=? WHERE id=?', [
      body.last_name ?? existing.last_name,
      body.first_name ?? existing.first_name,
      body.middle_name !== undefined ? body.middle_name : existing.middle_name,
      body.phone !== undefined ? body.phone : existing.phone,
      body.email !== undefined ? body.email : existing.email,
      id,
    ]);
    persist();
    const row = dbGet(database, 'SELECT id, last_name, first_name, middle_name, phone, email, created_at FROM clients WHERE id = ?', [id]);
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const database = getDb();
    const r = dbRun(database, 'DELETE FROM clients WHERE id = ?', [id]);
    if (r.changes === 0) return res.status(404).json({ message: 'Клиент не найден' });
    persist();
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
