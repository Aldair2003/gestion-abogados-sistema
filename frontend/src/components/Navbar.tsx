import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ScaleIcon } from '@heroicons/react/24/outline';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white dark:bg-[#1a2234] shadow-sm border-b border-gray-200/20 dark:border-dark-700/20">
      <div className="flex items-center justify-between px-4 py-2">
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <ScaleIcon className="h-8 w-8 text-primary-500" />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Sistema Legal
          </span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">{user?.nombre}</span>
          <button
            onClick={logout}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}; 