import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserGroupIcon,
  HomeIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronDoubleLeftIcon,
  MapPinIcon,
} from '../icons/CustomIcons';
import logo from '../../assets/logo1.svg';

interface MenuItem {
  title: string;
  path?: string;
  icon: React.FC<{ className?: string }>;
  adminOnly?: boolean;
  subItems?: {
    title: string;
    path: string;
    description?: string;
    adminOnly?: boolean;
  }[];
  description?: string;
}

const sidebarAnimation = {
  open: {
    width: 240,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  closed: {
    width: 80,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const selectedItemAnimation = {
  hidden: { 
    opacity: 0,
    transition: {
      duration: 0.05,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.05,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const itemAnimation = {
  hidden: { 
    opacity: 0,
    transition: {
      duration: 0.1,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.1,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

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
      title: 'Cantones',
      icon: MapPinIcon,
      path: '/cantones',
      description: 'Gestionar cantones'
    },
    {
      title: 'Usuarios',
      icon: UserGroupIcon,
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
      icon: HomeIcon,
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
      path: '/calendario',
      description: 'Ver calendario'
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
        relative bg-dark-800
        ${isCollapsed ? 'w-20' : 'w-60'}
      `}
    >
      <motion.div
        className="absolute inset-0 w-full h-full overflow-hidden"
        initial={false}
        animate={isCollapsed ? "closed" : "open"}
        variants={sidebarAnimation}
        layout
      >
        {/* Header del Sidebar con Link */}
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-700">
          <Link to="/dashboard" className="flex items-center w-full group">
            <div className="flex items-center w-full">
              <div className="relative flex justify-center">
                <img 
                  src={logo} 
                  alt="M&V Abogados Logo" 
                  className={`
                    ${isCollapsed ? 'h-10 mx-auto' : 'h-10'} 
                    w-auto flex-shrink-0
                    [filter:brightness(0)_invert(1)]
                    group-hover:[filter:brightness(0)_invert(0.8)]
                    transition-all duration-100
                  `}
                />
              </div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    className="ml-3 overflow-hidden flex items-center"
                    variants={itemAnimation}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <span className="text-lg font-semibold text-white whitespace-nowrap">
                      M&V Abogados
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                        className="flex items-center w-full px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-all"
                        onClick={() => handleDisclosureChange(open, item.title)}
                      >
                        <div className="flex items-center w-full">
                          <div className="relative">
                            <item.icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
                          </div>
                          <AnimatePresence mode="wait">
                            {!isCollapsed && (
                              <motion.div
                                className="flex items-center flex-1"
                                variants={itemAnimation}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                              >
                                <span className="ml-3 flex-1 text-left">{item.title}</span>
                                <motion.div
                                  animate={{ rotate: open ? 180 : 0 }}
                                  transition={{ duration: 0.1 }}
                                >
                                  <ChevronDownIcon className="w-5 h-5" />
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </Disclosure.Button>

                      <AnimatePresence>
                        {!isCollapsed && open && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ 
                              opacity: 1, 
                              height: 'auto',
                              transition: {
                                duration: 0.1
                              }
                            }}
                            exit={{ 
                              opacity: 0, 
                              height: 0,
                              transition: {
                                duration: 0.1
                              }
                            }}
                          >
                            <div className="mt-1 ml-4 space-y-1">
                              {renderSubItems(item.subItems)}
                            </div>
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
                    group flex items-center w-full px-4 py-2.5 rounded-lg
                    ${location.pathname === item.path
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                    transition-all duration-50
                  `}
                >
                  <div className="relative flex items-center">
                    <item.icon className={`
                      ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} 
                      flex-shrink-0
                      ${location.pathname === item.path ? 'text-white' : 'text-gray-300 group-hover:text-white'}
                      transition-all duration-50
                    `} />
                    {isCollapsed && item.description && (
                      <motion.div 
                        className="
                          absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm
                          rounded opacity-0 group-hover:opacity-100 pointer-events-none
                          whitespace-nowrap z-50
                        "
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.05 }}
                      >
                        {item.title}
                        <div className="text-xs text-gray-400">{item.description}</div>
                      </motion.div>
                    )}
                  </div>
                  <AnimatePresence mode="sync">
                    {!isCollapsed && (
                      <motion.div
                        className="ml-3 flex flex-col flex-1 text-left"
                        variants={location.pathname === item.path ? selectedItemAnimation : itemAnimation}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <span>{item.title}</span>
                        {item.description && (
                          <span className="text-xs text-gray-400">{item.description}</span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Botón flotante para colapsar */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <button
            onClick={toggleSidebar}
            className="
              flex items-center gap-2 px-3 py-2 rounded-full
              bg-primary-500 text-white shadow-lg
              hover:bg-primary-600 transition-all duration-50
            "
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.05 }}
            >
              <ChevronDoubleLeftIcon className="w-5 h-5" />
            </motion.div>
            <AnimatePresence mode="sync">
              {!isCollapsed && (
                <motion.span
                  className="text-sm font-medium"
                  variants={itemAnimation}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  Colapsar menú
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 