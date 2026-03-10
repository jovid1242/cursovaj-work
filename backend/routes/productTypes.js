import { Router } from 'express';
import { getDb, persist, dbGet, dbAll, dbRun } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const database = getDb();
    const rows = dbAll(database, 'SELECT id, name FROM product_types ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const name = req.body?.name?.trim();
    if (!name) return res.status(400).json({ message: 'Укажите название' });
    const database = getDb();
    try {
      database.run('INSERT INTO product_types (name) VALUES (?)', [name]);
    } catch (e) {
      if (e.message?.includes('UNIQUE')) return res.status(400).json({ message: 'Такой тип уже есть' });
      throw e;
    }
    const id = dbGet(database, 'SELECT last_insert_rowid() as id').id;
    persist();
    const row = dbGet(database, 'SELECT id, name FROM product_types WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = req.body?.name?.trim();
    if (!name) return res.status(400).json({ message: 'Укажите название' });
    const database = getDb();
    const r = dbRun(database, 'UPDATE product_types SET name = ? WHERE id = ?', [name, id]);
    if (r.changes === 0) return res.status(404).json({ message: 'Тип не найден' });
    persist();
    const row = dbGet(database, 'SELECT id, name FROM product_types WHERE id = ?', [id]);
    res.json(row);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ message: 'Такой тип уже есть' });
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const database = getDb();
    const r = dbRun(database, 'DELETE FROM product_types WHERE id = ?', [Number(req.params.id)]);
    if (r.changes === 0) return res.status(404).json({ message: 'Тип не найден' });
    persist();
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
