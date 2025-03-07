export interface FiltersState {
  search: string;
  rol: string;
  isActive: string;
  createdAtStart: Date | null;
  createdAtEnd: Date | null;
  lastLoginStart: Date | null;
  lastLoginEnd: Date | null;
  page: number;
  limit: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
} 