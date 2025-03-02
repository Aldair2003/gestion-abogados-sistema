import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { InitialProfileModal } from '../components/profile/InitialProfileModal';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User } from '../types/user';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, updateUser } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (user && !user.isProfileCompleted) {
      setShowProfileModal(true);
    }
  }, [user]);

  const handleProfileComplete = async (data: Partial<User>) => {
    try {
      const response = await api.post('/users/complete-profile', data);
      updateUser(response.data);
      setShowProfileModal(false);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    }
  };

  return (
    <div className={showProfileModal ? 'filter blur-sm' : ''}>
      {children}
      
      <InitialProfileModal
        isOpen={showProfileModal}
        onComplete={handleProfileComplete}
        onClose={() => setShowProfileModal(false)}
        initialData={user || undefined}
      />
    </div>
  );
}; 