import { useState } from 'react';
import { useOrders, useCreateOrder, useUpdateOrder, useDeleteOrder } from '../hooks/useOrders';
import { useClients } from '../hooks/useClients';
import { useProductTypes } from '../hooks/useProductTypes';
import { useMaterials } from '../hooks/useMaterials';
import '../styles/ui.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Все' },
  { value: 'новый', label: 'Новый' },
  { value: 'в работе', label: 'В работе' },
  { value: 'готов', label: 'Готов' },
  { value: 'выдан', label: 'Выдан' },
];

function OrderModal({ order, clients, productTypes, materials, onClose, onSave, loading }) {
  const isEdit = !!order;
  const [form, setForm] = useState(
    order
      ? { client_id: order.client_id, product_type_id: order.product_type_id, material_id: order.material_id, weight: order.weight, work_price: order.work_price, status: order.status }
      : { client_id: '', product_type_id: '', material_id: '', weight: '', work_price: '', status: 'новый' }
  );

  const material = materials?.find((m) => m.id === Number(form.material_id));
  const total = material && form.weight && form.work_price
    ? Math.round(Number(form.weight) * material.price_per_gram + Number(form.work_price))
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(isEdit ? { ...form, id: order.id } : form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Редактировать заказ' : 'Новый заказ'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Клиент</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                required
              >
                <option value="">Выберите клиента</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.last_name} {c.first_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Тип изделия</label>
                <select
                  value={form.product_type_id}
                  onChange={(e) => setForm((f) => ({ ...f, product_type_id: e.target.value }))}
                  required
                >
                  <option value="">Выберите</option>
                  {productTypes?.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Материал</label>
                <select
                  value={form.material_id}
                  onChange={(e) => setForm((f) => ({ ...f, material_id: e.target.value }))}
                  required
                >
                  <option value="">Выберите</option>
                  {materials?.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Вес (г)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Стоимость работы (₽)</label>
                <input
                  type="number"
                  min="0"
                  value={form.work_price}
                  onChange={(e) => setForm((f) => ({ ...f, work_price: e.target.value }))}
                  required
                />
              </div>
            </div>
            {total !== null && (
              <p style={{ color: 'var(--accent)', fontWeight: 500 }}>Итого: {total} ₽</p>
            )}
            {isEdit && (
              <div className="form-group">
                <label>Статус</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Orders() {
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | order
  const { data: orders = [], isLoading } = useOrders(statusFilter);
  const { data: clients = [] } = useClients();
  const { data: productTypes = [] } = useProductTypes();
  const { data: materials = [] } = useMaterials();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const handleSave = async (payload) => {
    if (payload.id) {
      await updateOrder.mutateAsync({ id: payload.id, ...payload });
    } else {
      await createOrder.mutateAsync(payload);
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить заказ?')) await deleteOrder.mutateAsync(id);
  };

  const getClientName = (clientId) => {
    const c = clients.find((x) => x.id === clientId);
    return c ? `${c.last_name} ${c.first_name}` : '—';
  };
  const getTypeName = (id) => productTypes.find((x) => x.id === id)?.name ?? '—';
  const getMaterialName = (id) => materials.find((x) => x.id === id)?.name ?? '—';

  const statusClass = (s) => {
    if (s === 'новый') return 'badge-new';
    if (s === 'в работе') return 'badge-work';
    if (s === 'готов') return 'badge-ready';
    return 'badge-done';
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Заказы</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-primary)',
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" onClick={() => setModal('add')}>
            + Новый заказ
          </button>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Клиент</th>
                  <th>Тип</th>
                  <th>Материал</th>
                  <th>Вес, г</th>
                  <th>Итого, ₽</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{getClientName(o.client_id)}</td>
                    <td>{getTypeName(o.product_type_id)}</td>
                    <td>{getMaterialName(o.material_id)}</td>
                    <td>{o.weight}</td>
                    <td>{o.total_price?.toLocaleString('ru-RU')}</td>
                    <td><span className={`badge ${statusClass(o.status)}`}>{o.status}</span></td>
                    <td>{o.created_at}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onClick={() => setModal(o)}>
                          Изменить
                        </button>
                        <button type="button" className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onClick={() => handleDelete(o.id)}>
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {orders.length === 0 && !isLoading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Нет заказов</p>
        )}
      </div>

      {modal && (
        <OrderModal
          order={modal === 'add' ? null : modal}
          clients={clients}
          productTypes={productTypes}
          materials={materials}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={createOrder.isPending || updateOrder.isPending}
        />
      )}
    </>
  );
}
