import { useState } from 'react';
import { useProductTypes, useCreateProductType, useUpdateProductType, useDeleteProductType } from '../hooks/useProductTypes';
import '../styles/ui.css';

function TypeModal({ productType, onClose, onSave, loading }) {
  const isEdit = !!productType;
  const [name, setName] = useState(productType?.name ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(isEdit ? { id: productType.id, name } : { name });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Редактировать тип' : 'Новый тип изделия'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Название</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Серьги" required />
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

export function ProductTypes() {
  const [modal, setModal] = useState(null);
  const { data: productTypes = [], isLoading } = useProductTypes();
  const createType = useCreateProductType();
  const updateType = useUpdateProductType();
  const deleteType = useDeleteProductType();

  const handleSave = async (payload) => {
    if (payload.id) {
      await updateType.mutateAsync({ id: payload.id, name: payload.name });
    } else {
      await createType.mutateAsync({ name: payload.name });
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить тип изделия?')) await deleteType.mutateAsync(id);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Типы изделий</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal('add')}>+ Добавить тип</button>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productTypes.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onClick={() => setModal(t)}>Изменить</button>
                        <button type="button" className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onClick={() => handleDelete(t.id)}>Удалить</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {productTypes.length === 0 && !isLoading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Нет типов изделий</p>
        )}
      </div>

      {modal && (
        <TypeModal
          productType={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={createType.isPending || updateType.isPending}
        />
      )}
    </>
  );
}
