import { Router } from 'express';
import { getDb, persist, dbGet, dbAll, dbRun } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const STATUSES = ['новый', 'в работе', 'готов', 'выдан'];

function calcTotal(weight, pricePerGram, workPrice) {
  return Math.round(weight * pricePerGram + workPrice);
}

router.get('/', (req, res) => {
  try {
    const database = getDb();
    const status = req.query.status?.trim();
    const rows =
      status && STATUSES.includes(status)
        ? dbAll(
            database,
            'SELECT id, client_id, product_type_id, material_id, weight, work_price, total_price, status, created_at, completed_at FROM orders WHERE status = ? ORDER BY id',
            [status]
          )
        : dbAll(
            database,
            'SELECT id, client_id, product_type_id, material_id, weight, work_price, total_price, status, created_at, completed_at FROM orders ORDER BY id'
          );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const database = getDb();
    const row = dbGet(
      database,
      'SELECT id, client_id, product_type_id, material_id, weight, work_price, total_price, status, created_at, completed_at FROM orders WHERE id = ?',
      [Number(req.params.id)]
    );
    if (!row) return res.status(404).json({ message: 'Заказ не найден' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { client_id, product_type_id, material_id, weight, work_price } = req.body || {};
    const clientId = Number(client_id);
    const productTypeId = Number(product_type_id);
    const materialId = Number(material_id);
    const weightVal = Number(weight);
    const workPriceVal = Number(work_price);
    if (!clientId || !productTypeId || !materialId || isNaN(weightVal) || weightVal <= 0 || isNaN(workPriceVal) || workPriceVal < 0) {
      return res.status(400).json({ message: 'Заполните клиента, тип, материал, вес и стоимость работы' });
    }
    const database = getDb();
    const material = dbGet(database, 'SELECT price_per_gram FROM materials WHERE id = ?', [materialId]);
    if (!material) return res.status(400).json({ message: 'Материал не найден' });
    const totalPrice = calcTotal(weightVal, material.price_per_gram, workPriceVal);
    database.run(
      `INSERT INTO orders (client_id, product_type_id, material_id, weight, work_price, total_price, status) VALUES (?, ?, ?, ?, ?, ?, 'новый')`,
      [clientId, productTypeId, materialId, weightVal, workPriceVal, totalPrice]
    );
    const id = dbGet(database, 'SELECT last_insert_rowid() as id').id;
    persist();
    const row = dbGet(
      database,
      'SELECT id, client_id, product_type_id, material_id, weight, work_price, total_price, status, created_at, completed_at FROM orders WHERE id = ?',
      [id]
    );
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const database = getDb();
    const existing = dbGet(database, 'SELECT * FROM orders WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Заказ не найден' });
    const body = req.body || {};
    const clientId = body.client_id !== undefined ? Number(body.client_id) : existing.client_id;
    const productTypeId = body.product_type_id !== undefined ? Number(body.product_type_id) : existing.product_type_id;
    const materialId = body.material_id !== undefined ? Number(body.material_id) : existing.material_id;
    const weightVal = body.weight !== undefined ? Number(body.weight) : existing.weight;
    const workPriceVal = body.work_price !== undefined ? Number(body.work_price) : existing.work_price;
    const status = STATUSES.includes(body.status) ? body.status : existing.status;
    const material = dbGet(database, 'SELECT price_per_gram FROM materials WHERE id = ?', [materialId]);
    if (!material) return res.status(400).json({ message: 'Материал не найден' });
    const totalPrice = calcTotal(weightVal, material.price_per_gram, workPriceVal);
    database.run(
      `UPDATE orders SET client_id=?, product_type_id=?, material_id=?, weight=?, work_price=?, total_price=?, status=? WHERE id=?`,
      [clientId, productTypeId, materialId, weightVal, workPriceVal, totalPrice, status, id]
    );
    persist();
    const row = dbGet(
      database,
      'SELECT id, client_id, product_type_id, material_id, weight, work_price, total_price, status, created_at, completed_at FROM orders WHERE id = ?',
      [id]
    );
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const database = getDb();
    const r = dbRun(database, 'DELETE FROM orders WHERE id = ?', [Number(req.params.id)]);
    if (r.changes === 0) return res.status(404).json({ message: 'Заказ не найден' });
    persist();
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
