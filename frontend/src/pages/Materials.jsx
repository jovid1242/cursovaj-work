import { useState } from 'react';
import { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial } from '../hooks/useMaterials';
import '../styles/ui.css';

function MaterialModal({ material, onClose, onSave, loading }) {
  const isEdit = !!material;
  const [form, setForm] = useState(
    material ? { name: material.name, price_per_gram: material.price_per_gram } : { name: '', price_per_gram: '' }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(isEdit ? { id: material.id, ...form } : form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Редактировать материал' : 'Новый материал'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Название</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Золото 585, Серебро 925…" required />
            </div>
            <div className="form-group">
              <label>Цена за грамм (₽)</label>
              <input type="number" min="0" step="0.01" value={form.price_per_gram} onChange={(e) => setForm((f) => ({ ...f, price_per_gram: e.target.value }))} required />
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

export function Materials() {
  const [modal, setModal] = useState(null);
  const { data: materials = [], isLoading } = useMaterials();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const handleSave = async (payload) => {
    if (payload.id) {
      await updateMaterial.mutateAsync({ id: payload.id, name: payload.name, price_per_gram: payload.price_per_gram });
    } else {
      await createMaterial.mutateAsync(payload);
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить материал?')) await deleteMaterial.mutateAsync(id);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Материалы</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal('add')}>+ Добавить материал</button>
      </div>

      <div className="card">
        {isLoading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Цена за грамм, ₽</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{Number(m.price_per_gram).toLocaleString('ru-RU')}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onClick={() => setModal(m)}>Изменить</button>
                        <button type="button" className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onClick={() => handleDelete(m.id)}>Удалить</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {materials.length === 0 && !isLoading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Нет материалов</p>
        )}
      </div>

      {modal && (
        <MaterialModal
          material={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={createMaterial.isPending || updateMaterial.isPending}
        />
      )}
    </>
  );
}
