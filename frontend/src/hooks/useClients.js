import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

const keys = { all: ['clients'], one: (id) => ['clients', id] };

export function useClients() {
  return useQuery({
    queryKey: keys.all,
    queryFn: () => api.get('/clients').then((r) => r.data),
  });
}

export function useClient(id) {
  return useQuery({
    queryKey: keys.one(id),
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/clients', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/clients/${id}`, body).then((r) => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: keys.all });
      if (variables?.id) qc.invalidateQueries({ queryKey: keys.one(variables.id) });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
