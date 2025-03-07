import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Activity } from '../types/user';

interface ActivityFilters {
  userId?: number;
  targetId?: number;
  category?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  isImportant?: boolean;
  page?: number;
  limit?: number;
  metadata?: {
    browser?: string;
    os?: string;
    location?: string;
    ipAddress?: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface ActivitySummary {
  total: number;
  last30Days: {
    total: number;
    byCategory: Record<string, number>;
  };
  mostFrequent: Array<{
    action: string;
    count: number;
    category: string;
  }>;
}

export const useActivityLogs = (initialFilters?: ActivityFilters) => {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters || {});
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [summary, setSummary] = useState<ActivitySummary | null>(null);

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/activity/logs', { 
        params: { 
          ...filters,
          page,
          limit: filters.limit || 10
        } 
      });

      if (response.data?.status === 'success') {
        const { data, pagination: paginationData } = response.data.data;

        if (page === 1) {
          setLogs(data || []);
        } else {
          setLogs(prevLogs => [...prevLogs, ...(data || [])]);
        }

        setPagination({
          currentPage: page,
          totalPages: paginationData.totalPages || 1,
          totalItems: paginationData.total || 0
        });
      } else {
        throw new Error(response.data?.message || 'Error al cargar las actividades');
      }

    } catch (error: any) {
      console.error('Error fetching logs:', error);
      setError(error.response?.data?.message || 'Error al cargar el historial de actividad');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get('/api/activity/summary', {
        params: { userId: filters.userId }
      });

      if (response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching activity summary:', error);
    }
  }, [filters.userId]);

  // Cargar logs cuando cambian los filtros
  useEffect(() => {
    const loadInitialLogs = async () => {
      await fetchLogs(1);
    };
    loadInitialLogs();
  }, [fetchLogs]);

  // Cargar resumen cuando cambia el usuario
  useEffect(() => {
    if (filters.userId) {
      fetchSummary();
    }
  }, [filters.userId, fetchSummary]);

  const loadMore = useCallback(async () => {
    if (!loading && pagination.currentPage < pagination.totalPages) {
      await fetchLogs(pagination.currentPage + 1);
    }
  }, [loading, pagination.currentPage, pagination.totalPages, fetchLogs]);

  const updateFilters = useCallback((newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const toggleImportance = useCallback(async (activityId: number) => {
    try {
      const response = await api.patch(`/api/activity/logs/${activityId}/toggle-importance`);
      
      if (response.data) {
        setLogs(prevLogs => 
          prevLogs.map(log => 
            log.id === activityId 
              ? { 
                  ...log, 
                  details: { 
                    ...log.details, 
                    isImportant: !log.details.isImportant 
                  } 
                }
              : log
          )
        );
      }
    } catch (error) {
      console.error('Error toggling activity importance:', error);
    }
  }, []);

  const exportActivities = useCallback(async (format: 'pdf' | 'excel') => {
    try {
      const response = await api.get(`/api/activity/export/${format}`, {
        params: filters,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `actividades.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Error exporting activities to ${format}:`, error);
    }
  }, [filters]);

  return { 
    logs, 
    loading, 
    error,
    filters,
    pagination,
    summary,
    hasMore: pagination.currentPage < pagination.totalPages,
    loadMore,
    updateFilters,
    clearFilters,
    toggleImportance,
    exportActivities,
    refresh: () => fetchLogs(1)
  };
}; 