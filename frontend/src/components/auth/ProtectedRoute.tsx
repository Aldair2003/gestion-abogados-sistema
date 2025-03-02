import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export const ProtectedRoute = ({ children, isAdmin = false }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Solo redirigir al dashboard si es una ruta de admin y el usuario no es admin
  if (isAdmin && user?.rol !== 'ADMIN') {
    console.log('Usuario no es admin, redirigiendo al dashboard');
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // Si todo está bien, renderizar los children
  console.log('Renderizando ruta protegida:', location.pathname);
  return <>{children}</>;
}; 