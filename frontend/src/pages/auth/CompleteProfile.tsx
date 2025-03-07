import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CompleteProfileForm } from '../../components/auth/CompleteProfileForm';
import { Dashboard } from '../dashboard/Dashboard';

export const CompleteProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isProfileCompleted) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleProfileCompleted = () => {
    navigate('/dashboard');
  };

  const handleClose = () => {
    logout();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      {/* Dashboard de fondo */}
      <div className="opacity-50 pointer-events-none">
        <Dashboard />
      </div>

      {/* Contenedor del formulario */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Completa tu perfil</h2>
          <CompleteProfileForm onProfileCompleted={handleProfileCompleted} />
          <button
            onClick={handleClose}
            className="mt-4 w-full text-gray-600 hover:text-gray-800"
          >
            Cancelar y cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}; 