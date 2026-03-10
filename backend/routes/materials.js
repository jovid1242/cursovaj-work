import { Router } from 'express';
import { getDb, persist, dbGet, dbAll, dbRun } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const database = getDb();
    const rows = dbAll(database, 'SELECT id, name, price_per_gram FROM materials ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const name = req.body?.name?.trim();
    const price = Number(req.body?.price_per_gram);
    if (!name || isNaN(price) || price < 0) return res.status(400).json({ message: 'Укажите название и цену за грамм' });
    const database = getDb();
    database.run('INSERT INTO materials (name, price_per_gram) VALUES (?, ?)', [name, price]);
    const id = dbGet(database, 'SELECT last_insert_rowid() as id').id;
    persist();
    const row = dbGet(database, 'SELECT id, name, price_per_gram FROM materials WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const database = getDb();
    const existing = dbGet(database, 'SELECT * FROM materials WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Материал не найден' });
    const name = req.body?.name?.trim();
    const price = req.body?.price_per_gram !== undefined ? Number(req.body.price_per_gram) : existing.price_per_gram;
    if (name !== undefined && !name) return res.status(400).json({ message: 'Название не может быть пустым' });
    if (isNaN(price) || price < 0) return res.status(400).json({ message: 'Некорректная цена' });
    database.run('UPDATE materials SET name = ?, price_per_gram = ? WHERE id = ?', [name ?? existing.name, price, id]);
    persist();
    const row = dbGet(database, 'SELECT id, name, price_per_gram FROM materials WHERE id = ?', [id]);
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const database = getDb();
    const r = dbRun(database, 'DELETE FROM materials WHERE id = ?', [Number(req.params.id)]);
    if (r.changes === 0) return res.status(404).json({ message: 'Материал не найден' });
    persist();
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
