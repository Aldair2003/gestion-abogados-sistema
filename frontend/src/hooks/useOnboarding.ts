import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

interface OnboardingStatus {
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  isTemporaryPassword: boolean;
  email: string;
  rol: string;
  pendingSteps: {
    requiresPasswordChange: boolean;
    requiresProfileCompletion: boolean;
    isFirstTimeUser: boolean;
  };
}

export const useOnboarding = () => {
  const { token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  const fetchOnboardingStatus = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/users/onboarding-status');
      setOnboardingStatus(response.data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener el estado de onboarding';
      setError(errorMessage);
      toast.error('No se pudo obtener el estado de onboarding');
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  const refreshStatus = useCallback(() => {
    fetchOnboardingStatus();
  }, [fetchOnboardingStatus]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOnboardingStatus();
    }
  }, [isAuthenticated, fetchOnboardingStatus]);

  return {
    loading,
    error,
    onboardingStatus,
    refreshStatus
  };
}; 