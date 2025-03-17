import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationsDropdown } from './NotificationsDropdown';
import { getPhotoUrl } from '../../utils/urls';
import api from '../../services/api';

interface BreadcrumbItem {
  label: string;
  path: string;
  isClickable: boolean;
}

const BreadcrumbItemComponent = ({ item, isLast }: { item: BreadcrumbItem; isLast: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <motion.div
      initial={{ opacity: 0, x: -3, scale: 0.95, z: -10 }}
      animate={{ opacity: 1, x: 0, scale: 1, z: 0 }}
      transition={{ 
        duration: 0.4,
        ease: [0.2, 0.65, 0.3, 0.9],
        scale: { duration: 0.35 },
        opacity: { duration: 0.4 }
      }}
      className="flex items-center transform-gpu"
      style={{ perspective: '1000px' }}
    >
      {item.isClickable ? (
        <Link
          to={item.path}
          className={`
            text-gray-600 hover:text-primary-600 
            transition-all duration-200 ease-in-out
            text-[12.5px] tracking-wide px-1.5
            hover:scale-[1.02] transform-gpu
            ${isActive ? 'text-primary-600' : ''}
          `}
        >
          {item.label}
        </Link>
      ) : (
        <span className={`
          text-[12.5px] tracking-wide px-1.5
          ${isLast ? 'text-primary-600 font-medium' : 'text-gray-900'}
        `}>
          {item.label}
        </span>
      )}
    </motion.div>
  );
};

const Breadcrumb = () => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBreadcrumbs = async () => {
      setLoading(true);
      const paths = location.pathname.split('/').filter(Boolean);
      const items: BreadcrumbItem[] = [];
      
      try {
        let currentPath = '';
        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];
          currentPath += `/${path}`;

          if (path === 'personas') {
            const cantonId = paths[i-1];
            try {
              const response = await api.get(`/cantones/${cantonId}`);
              if (response.data?.data) {
                const canton = response.data.data;
                items.push({
                  label: canton.nombre,
                  path: '/cantones',
                  isClickable: true
                });
              }
            } catch (error) {
              console.error('Error cargando información del cantón:', error);
            }
          }
          else if (path === 'proceso-impugnacion') {
            const personaId = paths[i + 1];
            if (personaId) {
              try {
                const response = await api.get(`/personas/${personaId}`);
                if (response.data?.data) {
                  const persona = response.data.data;
                  items.push({
                    label: persona.canton.nombre,
                    path: '/cantones',
                    isClickable: true
                  });
                  items.push({
                    label: `${persona.nombres} ${persona.apellidos}`,
                    path: `/cantones/${persona.cantonId}/personas`,
                    isClickable: true
                  });
                  items.push({
                    label: 'Proceso e Impugnación',
                    path: currentPath + `/${personaId}`,
                    isClickable: false
                  });
                }
              } catch (error) {
                console.error('Error cargando información de la persona:', error);
              }
            }
          }
        }
        
        setBreadcrumbs(items);
      } catch (error) {
        console.error('Error generando breadcrumbs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBreadcrumbs();
  }, [location]);

  if (loading) {
    return <div className="h-2.5 w-16 bg-gray-200 animate-pulse rounded" />;
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-[200px]">
      <AnimatePresence mode="wait">
        <motion.div 
          className="flex items-center space-x-1.5"
          initial={{ opacity: 0, y: -2, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 2, scale: 0.98 }}
          transition={{ 
            duration: 0.35,
            ease: [0.2, 0.65, 0.3, 0.9],
            scale: { duration: 0.3 }
          }}
          style={{ perspective: '1000px' }}
        >
          {breadcrumbs.map((item, index) => (
            <Fragment key={item.path + index}>
              {index > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  className="text-gray-300 select-none text-[10px] font-light transform-gpu"
                >
                  •
                </motion.span>
              )}
              <BreadcrumbItemComponent 
                item={item} 
                isLast={index === breadcrumbs.length - 1} 
              />
            </Fragment>
          ))}
        </motion.div>
      </AnimatePresence>
    </nav>
  );
};

const SearchBar = () => {
  return (
    <div className="relative max-w-2xl w-full mx-auto">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 
                                    transition-colors duration-200 group-hover:text-primary-500" />
        <input
          type="search"
          placeholder="Buscar..."
          className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white dark:bg-dark-600 
                   border border-gray-200 dark:border-dark-500
                   text-gray-900 dark:text-gray-100
                   placeholder-gray-400 dark:placeholder-gray-500
                   focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                   transition-all duration-200 ease-in-out
                   hover:border-primary-500/30 hover:shadow-sm"
        />
      </div>
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
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

export const Header = ({ className = '', onMenuClick, isSidebarOpen }: HeaderProps) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Resetear el error de imagen cuando cambie el usuario o su foto
    setImageError(false);
  }, [user?.photoUrl]);

  const handleImageError = () => {
    setImageError(true);
  };

  const renderAvatar = () => {
    if (user?.photoUrl && !imageError) {
      return (
        <img 
          src={getPhotoUrl(user.photoUrl)} 
          alt={user?.nombre || 'Usuario'} 
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
      );
    }

    return (
      <div className="h-full w-full flex items-center justify-center bg-[#4F46E5] text-white font-medium">
        {(user?.nombre?.[0] || user?.email?.[0] || 'U').toUpperCase()}
      </div>
    );
  };

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

  // Botón de menú para móviles
  const MenuButton = () => (
    <button
      onClick={onMenuClick}
      className={`
        md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700/50
        transition-all duration-300 ease-in-out group -ml-1.5
        ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
      `}
      aria-label="Abrir menú"
    >
      <svg
        className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400
                  transition-colors duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );

  return (
    <header className={`px-4 py-2.5 flex flex-wrap items-center gap-2 md:gap-4 ${className}`}>
      <MenuButton />
      <div className="flex-1 flex flex-wrap items-center gap-2 md:gap-4 min-w-0">
        <Breadcrumb />
        <div className="hidden md:block flex-1">
          <SearchBar />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <NotificationsDropdown />
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
            <div className="relative h-8 w-8 md:h-9 md:w-9 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                         ring-2 ring-primary-500/20 dark:ring-primary-500/30">
              {renderAvatar()}
            </div>
            <div className="text-left hidden lg:block">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
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
                                 focus:outline-none divide-y divide-gray-100 dark:divide-dark-600
                                 z-[9999]">
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
    </header>
  );
}; 