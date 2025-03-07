import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingModal } from './OnboardingModal';

export const PrivateRoute = () => {
  const { isAuthenticated, isLoading, user, completeOnboarding } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && (user.isTemporaryPassword || !user.isProfileCompleted)) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <>
      <Outlet />
      <OnboardingModal 
        isOpen={showOnboarding} 
        onComplete={completeOnboarding} 
      />
    </>
  ) : <Navigate to="/login" replace />;
}; 