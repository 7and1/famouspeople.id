import { apiFetch } from './client';
import type { PersonProfile } from './types';

export interface PersonResponse {
  data: PersonProfile;
}

export const getPerson = async (slug: string): Promise<PersonProfile> => {
  const res = await apiFetch<PersonResponse>(`/people/${slug}`, {}, { revalidate: 86400 });
  return res.data;
};

export interface SimilarPerson {
  fpid: string;
  slug: string;
  full_name: string;
  image_url: string | null;
  bio_summary: string | null;
  similarity_score: number;
}

export interface SimilarPeopleResponse {
  data: SimilarPerson[];
  meta: {
    limit: number;
    count: number;
  };
}

export const getSimilarPeople = async (slug: string, limit = 8): Promise<SimilarPerson[]> => {
  const res = await apiFetch<SimilarPeopleResponse>(`/people/${slug}/similar?limit=${limit}`, {}, { revalidate: 3600 });
  return res.data;
};
