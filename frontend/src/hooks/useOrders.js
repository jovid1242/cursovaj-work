import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

const keys = { all: (status) => ['orders', status], one: (id) => ['orders', id] };

export function useOrders(status) {
  return useQuery({
    queryKey: keys.all(status || null),
    queryFn: () =>
      api.get('/orders', status ? { params: { status } } : {}).then((r) => r.data),
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: keys.one(id),
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/orders', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/orders/${id}`, body).then((r) => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      if (variables.id) qc.invalidateQueries({ queryKey: keys.one(variables.id) });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
