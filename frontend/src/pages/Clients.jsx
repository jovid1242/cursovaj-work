import { useState } from 'react';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useClients';
import { useOrders } from '../hooks/useOrders';
import '../styles/ui.css';

function ClientModal({ client, onClose, onSave, loading }) {
  const isEdit = !!client;
  const [form, setForm] = useState(
    client
      ? { last_name: client.last_name, first_name: client.first_name, middle_name: client.middle_name || '', phone: client.phone || '', email: client.email || '' }
      : { last_name: '', first_name: '', middle_name: '', phone: '', email: '' }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(isEdit ? { ...form, id: client.id } : form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Редактировать клиента' : 'Новый клиент'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Фамилия</label>
                <input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Имя</label>
                <input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Отчество</label>
                <input value={form.middle_name} onChange={(e) => setForm((f) => ({ ...f, middle_name: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Clients() {
  const [modal, setModal] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const { data: clients = [], isLoading } = useClients();
  const { data: orders = [] } = useOrders();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const handleSave = async (payload) => {
    if (payload.id) {
      await updateClient.mutateAsync({ id: payload.id, ...payload });
    } else {
      await createClient.mutateAsync(payload);
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить клиента?')) await deleteClient.mutateAsync(id);
  };

  const clientOrders = historyClient ? orders.filter((o) => o.client_id === historyClient.id) : [];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Клиенты</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal('add')}>+ Добавить клиента</button>
      </div>

      <div className="card">
        {isLoading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Телефон</th>
                  <th>Email</th>
                  <th>Дата регистрации</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>{c.last_name} {c.first_name} {c.middle_name}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.created_at}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onClick={() => setHistoryClient(c)}>
                          История заказов
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onClick={() => setModal(c)}>Изменить</button>
                        <button type="button" className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onClick={() => handleDelete(c.id)}>Удалить</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {clients.length === 0 && !isLoading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Нет клиентов</p>
        )}
      </div>

      {modal && (
        <ClientModal
          client={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={createClient.isPending || updateClient.isPending}
        />
      )}

      {historyClient && (
        <div className="modal-backdrop" onClick={() => setHistoryClient(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>История заказов — {historyClient.last_name} {historyClient.first_name}</h2>
              <button type="button" className="modal-close" onClick={() => setHistoryClient(null)} aria-label="Закрыть">×</button>
            </div>
            <div className="modal-body">
              {clientOrders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Заказов нет</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>№ заказа</th>
                        <th>Итого, ₽</th>
                        <th>Статус</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientOrders.map((o) => (
                        <tr key={o.id}>
                          <td>{o.id}</td>
                          <td>{o.total_price?.toLocaleString('ru-RU')}</td>
                          <td>{o.status}</td>
                          <td>{o.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
