import React from 'react';
import { useSessionTimeout, SessionConfig } from '../../hooks/useSessionTimeout';
import { useAuth } from '../../hooks/useAuth';
import { SessionWarning } from './SessionWarning';

interface SessionManagerProps {
  children?: React.ReactNode;
  config?: Partial<SessionConfig>;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ children, config }) => {
  const { logout } = useAuth();
  const { showWarning, timeRemaining, extendSession } = useSessionTimeout(config);

  return (
    <>
      {children}
      <SessionWarning 
        showWarning={showWarning}
        timeRemaining={timeRemaining}
        onExtendSession={extendSession}
        onCloseSession={logout}
      />
    </>
  );
}; 