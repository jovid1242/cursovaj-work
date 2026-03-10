import { initDb } from './index.js';

initDb()
  .then(() => {
    console.log('База создана/обновлена. Запустите сервер: npm start');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
