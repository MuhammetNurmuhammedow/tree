import api from './api';
import type { Person, CreatePersonPayload, UpdatePersonPayload } from '@/types/person';

export const personService = {
  getAll: () =>
    api.get<Person[]>('/persons').then((r) => r.data),

  getById: (id: string) =>
    api.get<Person>(`/persons/${id}`).then((r) => r.data),

  search: (query: string) =>
    api.get<Person[]>('/persons/search', { params: { q: query } }).then((r) => r.data),

  create: (payload: CreatePersonPayload) =>
    api.post<Person>('/persons', payload).then((r) => r.data),

  update: (id: string, payload: UpdatePersonPayload) =>
    api.put<Person>(`/persons/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/persons/${id}`),

  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string; filename: string; size: number }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  updateAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Person>(`/persons/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

