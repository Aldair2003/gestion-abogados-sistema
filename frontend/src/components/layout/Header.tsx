import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { getPhotoUrl } from '../../utils/urls';

const Breadcrumb = () => {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  
  return (
    <div className="flex items-center space-x-2 text-sm">
      {paths.map((path, index) => (
        <Fragment key={path}>
          {index > 0 && (
            <span className="text-gray-400 dark:text-gray-500">/</span>
          )}
          <span 
            className={`capitalize ${
              index === paths.length - 1 
                ? 'text-gray-900 dark:text-white font-medium'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {path}
          </span>
        </Fragment>
      ))}
    </div>
  );
};

const SearchBar = () => {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="search"
        placeholder="Buscar..."
        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-dark-600 
                 border border-gray-200 dark:border-dark-500
                 text-gray-900 dark:text-gray-100
                 placeholder-gray-400 dark:placeholder-gray-500
                 focus:outline-none focus:ring-2 focus:ring-primary-500
                 transition-all duration-200"
      />
    </div>
  );
};

const formatRol = (rol: string) => {
  switch (rol) {
    case 'ADMIN':
      return 'Administrador';
    case 'COLABORADOR':
      return 'Colaborador';
    default:
      return rol;
  }
};

interface HeaderProps {
  className?: string;
}

export const Header = ({ className = '' }: HeaderProps) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAdminPanel = () => {
    console.log('Navegando al panel de administración...');
    if (location.pathname !== '/admin/usuarios') {
      navigate('/admin/usuarios', { replace: true });
    }
  };

  const handleProfile = () => {
    console.log('Navegando al perfil...');
    if (location.pathname !== '/profile') {
      navigate('/profile', { replace: true });
    }
  };

  const handleSettings = () => {
    console.log('Navegando a configuración...');
    if (location.pathname !== '/settings') {
      navigate('/settings', { replace: true });
    }
  };

  const handlePermissions = () => {
    console.log('Navegando a gestión de permisos...');
    if (location.pathname !== '/admin/permisos') {
      navigate('/admin/permisos', { replace: true });
    }
  };

  return (
    <header className={`bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 ${className}`}>
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6 flex-1">
          <Breadcrumb />
          <div className="max-w-lg w-full">
            <SearchBar />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationsDropdown />

          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
              <div className="relative h-9 w-9 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                           ring-2 ring-primary-500/20 dark:ring-primary-500/30">
                {user?.photoUrl ? (
                  <img 
                    src={getPhotoUrl(user.photoUrl)} 
                    alt={user?.nombre || 'Usuario'} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${user?.nombre || 'U'}&background=6366f1&color=fff`;
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary-700 dark:text-primary-500 font-medium">
                    {(user?.nombre?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.nombre || user?.email}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRol(user?.rol || '')}
                  </span>
                </div>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-dark-700 
                                   shadow-lg border border-gray-200 dark:border-dark-600 
                                   focus:outline-none divide-y divide-gray-100 dark:divide-dark-600">
                <div className="p-2 space-y-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button 
                        onClick={handleProfile}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm
                          ${active 
                            ? 'bg-gray-100 dark:bg-dark-600 text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-200'
                          }
                        `}
                      >
                        Mi Perfil
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button 
                        onClick={handleSettings}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm
                          ${active 
                            ? 'bg-gray-100 dark:bg-dark-600 text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-200'
                          }
                        `}>
                        Configuración
                      </button>
                    )}
                  </Menu.Item>

                  {isAdmin && (
                    <Menu.Item>
                      {({ active }) => (
                        <button 
                          onClick={handleAdminPanel}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg text-sm
                            ${active 
                              ? 'bg-gray-100 dark:bg-dark-600 text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-200'
                            }
                          `}
                        >
                          Panel de administración
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  {isAdmin && (
                    <Menu.Item>
                      {({ active }) => (
                        <button 
                          onClick={handlePermissions}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg text-sm
                            ${active 
                              ? 'bg-gray-100 dark:bg-dark-600 text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-200'
                            }
                          `}
                        >
                          Gestión de Permisos
                        </button>
                      )}
                    </Menu.Item>
                  )}
                </div>
                <div className="p-2">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm
                          ${active 
                            ? 'bg-danger-50 text-danger-600' 
                            : 'text-danger-500'
                          }
                        `}
                      >
                        Cerrar Sesión
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}; 