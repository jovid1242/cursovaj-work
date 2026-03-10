import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db/index.js';
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import productTypesRoutes from './routes/productTypes.js';
import materialsRoutes from './routes/materials.js';
import ordersRoutes from './routes/orders.js';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/product-types', productTypesRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/orders', ordersRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Ошибка сервера' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Не удалось инициализировать БД:', err);
    process.exit(1);
  });
