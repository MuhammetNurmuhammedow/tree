import { useState, useCallback } from 'react';
import { personService } from '@/services/personService';
import type { Person, CreatePersonPayload } from '@/types/person';

export function usePerson() {
  const [persons, setPersons]   = useState<Person[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await personService.getAll();
      setPersons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload: CreatePersonPayload) => {
    const created = await personService.create(payload);
    setPersons((prev) => [...prev, created]);
    return created;
  }, []);

  const remove = useCallback(async (id: string) => {
    await personService.delete(id);
    setPersons((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { persons, isLoading, error, fetchAll, create, remove };
}

