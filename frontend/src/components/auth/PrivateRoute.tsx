import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingModal } from './OnboardingModal';

export const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { onboardingStatus, loading: onboardingLoading } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (onboardingStatus && (
      onboardingStatus.pendingSteps.requiresPasswordChange || 
      onboardingStatus.pendingSteps.requiresProfileCompletion
    )) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [onboardingStatus]);

  if (isLoading || onboardingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <>
      <Outlet />
      <OnboardingModal isOpen={showOnboarding} />
    </>
  ) : <Navigate to="/login" replace />;
}; 