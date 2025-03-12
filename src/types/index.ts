import { Entry } from '@uniformdev/canvas';
import { AudienceType } from '@/constants/index';

export interface Brand {
  name: string;
  logo: string;
}

export interface Deal {
  name: string;
  brands: Brand[];
  audience?: string;
  audienceType: AudienceType;
  url: string;
  logo: string;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface RecommendationsResponse {
  deals: Deal[];
  pagination: PaginationData;
}

export interface EntriesResponse {
  entries: Array<{ entry: Entry }>;
  page: number;
  limit: number;
  total: number;
}
