import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  UsersIcon,
  FolderIcon,
  CalendarIcon,
  ChevronDownIcon,
  ScaleIcon,
  ChevronDoubleLeftIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
  subItems?: {
    title: string;
    path: string;
    description?: string;
    adminOnly?: boolean;
  }[];
}

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  // Inicializamos con un array vacío por defecto
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('openMenus');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Guardar estado de menús abiertos
  useEffect(() => {
    try {
      localStorage.setItem('openMenus', JSON.stringify(openMenus));
    } catch (error) {
      console.error('Error saving openMenus:', error);
    }
  }, [openMenus]);

  // Guardar estado del sidebar
  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    } catch (error) {
      console.error('Error saving sidebar state:', error);
    }
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev: boolean) => !prev);
  };

  const handleDisclosureChange = (isOpen: boolean, title: string) => {
    setOpenMenus((prev: string[]) => {
      if (isOpen && !prev.includes(title)) {
        return [...prev, title];
      }
      if (!isOpen && prev.includes(title)) {
        return prev.filter(menu => menu !== title);
      }
      return prev;
    });
  };

  const renderSubItems = (subItems: MenuItem['subItems']) => {
    if (!subItems) return null;
    
    return subItems.map((subItem) => (
      <button
        key={subItem.path}
        onClick={() => navigate(subItem.path)}
        className={`
          w-full text-left px-4 py-2 rounded-lg transition-colors
          ${location.pathname === subItem.path
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }
        `}
      >
        <div>{subItem.title}</div>
        {subItem.description && (
          <div className="text-xs text-gray-500">{subItem.description}</div>
        )}
      </button>
    ));
  };

  const menuItems: MenuItem[] = [
    {
      title: 'Usuarios',
      icon: UsersIcon,
      subItems: [
        { 
          title: 'Lista de Usuarios',
          path: '/admin/usuarios',
          description: 'Gestionar usuarios del sistema',
          adminOnly: true
        },
        { 
          title: 'Roles y Permisos',
          path: '/admin/roles',
          description: 'Configurar accesos',
          adminOnly: true
        }
      ]
    },
    {
      title: 'Expedientes',
      icon: FolderIcon,
      subItems: [
        { 
          title: 'Casos Activos',
          path: '/expedientes/activos',
          description: 'Ver casos en proceso'
        },
        { 
          title: 'Casos Cerrados',
          path: '/expedientes/cerrados',
          description: 'Historial de casos'
        },
        { 
          title: 'Nuevo Caso',
          path: '/expedientes/crear',
          description: 'Crear expediente'
        }
      ]
    },
    {
      title: 'Calendario',
      icon: CalendarIcon,
      path: '/calendario'
    }
  ];

  const filteredMenuItems = menuItems.map(item => ({
    ...item,
    subItems: item.subItems?.filter(subItem => !subItem.adminOnly || isAdmin)
  })).filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.subItems) {
      return item.subItems.length > 0;
    }
    return true;
  });

  return (
    <div 
      className={`
        relative bg-dark-800 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header del Sidebar con Link */}
      <div className="h-16 flex items-center px-4 border-b border-gray-700">
        <Link to="/dashboard" className="flex items-center w-full">
          <motion.div className="flex items-center w-full">
            <ScaleIcon className="h-8 w-8 text-primary-500 flex-shrink-0 hover:text-primary-400 transition-colors" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  className="ml-3 text-xl font-bold text-white overflow-hidden whitespace-nowrap"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  M&V Abogados
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </div>

      {/* Contenido del Sidebar */}
      <nav className="mt-4 px-3 pb-20">
        {filteredMenuItems.map((item) => (
          <div key={item.title} className="mb-2">
            {item.subItems ? (
              <Disclosure defaultOpen={openMenus.includes(item.title)}>
                {({ open }) => (
                  <>
                    <Disclosure.Button 
                      className="flex items-center w-full px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                      onClick={() => handleDisclosureChange(open, item.title)}
                    >
                      <motion.div className="flex items-center w-full">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                          {!isCollapsed && (
                            <motion.div
                              className="flex items-center flex-1"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                              <span className="ml-3 flex-1 text-left">{item.title}</span>
                              <ChevronDownIcon
                                className={`${
                                  open ? 'transform rotate-180' : ''
                                } w-5 h-5 transition-transform duration-200`}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </Disclosure.Button>

                    <AnimatePresence>
                      {!isCollapsed && open && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Disclosure.Panel className="mt-1 ml-4 space-y-1">
                            {renderSubItems(item.subItems)}
                          </Disclosure.Panel>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </Disclosure>
            ) : (
              <button
                onClick={() => navigate(item.path!)}
                className={`
                  flex items-center w-full px-4 py-2.5 rounded-lg transition-colors
                  ${location.pathname === item.path
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                  }
                `}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      className="ml-3"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* Botón flotante para colapsar */}
      <motion.div
        className="absolute bottom-4 left-0 right-0 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          onClick={toggleSidebar}
          className="
            flex items-center gap-2 px-3 py-2 rounded-full
            bg-primary-500 text-white shadow-lg
            hover:bg-primary-600 transition-colors
          "
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDoubleLeftIcon className="w-5 h-5" />
          </motion.div>
          {!isCollapsed && (
            <span className="text-sm font-medium">
              Colapsar menú
            </span>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}; 