// TypeScript type definitions for Person domain model

export type Gender = 'male' | 'female' | 'other' | 'unknown';

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  maiden_name?: string;
  gender: Gender;
  birth_date?: string;   // ISO date string "YYYY-MM-DD"
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  is_living: boolean;
  avatar_url?: string;
  biography?: string;
  created_at: string;
  updated_at: string;
}

export type CreatePersonPayload = Omit<Person, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePersonPayload = Partial<CreatePersonPayload>;

