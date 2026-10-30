import api from './api';

export interface CreateRelationshipPayload {
  person_id: string;
  related_person_id: string;
  relationship_type: 'parent' | 'child' | 'spouse' | 'former_spouse' | 'adoptive_parent' | 'adoptive_child';
  marriage_date?: string;
  divorce_date?: string;
  notes?: string;
}

export const relationshipService = {
  create: (payload: CreateRelationshipPayload) =>
    api.post('/relationships', payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/relationships/${id}`),

  getByPersonId: (personId: string) =>
    api.get(`/persons/${personId}/relationships`).then((r) => r.data),
};

