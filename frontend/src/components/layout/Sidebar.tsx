import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserGroupIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronDoubleLeftIcon,
  MapPinIcon,
  EnvelopeIcon,
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

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const Sidebar = ({ isOpen = true, onToggle, className = '' }: SidebarProps) => {
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
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
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
    onToggle?.();
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
      title: 'Personas',
      icon: UserGroupIcon,
      subItems: [
        { 
          title: 'Personas Recientes',
          path: '/personas/recientes',
          description: 'Ver personas más recientes'
        }
      ]
    },
    {
      title: 'Correo',
      icon: EnvelopeIcon,
      path: '/correo',
      description: 'Gestionar correo'
    },
    {
      title: 'Agenda',
      icon: CalendarIcon,
      path: '/agenda',
      description: 'Ver agenda'
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
    <motion.div
      className={`
        flex flex-col h-full bg-dark-800
        ${isCollapsed ? 'w-20' : 'w-60'}
        ${className}
        transition-all duration-300 ease-in-out
        shadow-xl md:shadow-none
        relative z-[70]
      `}
      initial={false}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarAnimation}
      layout
    >
      {/* Header del Sidebar con Link */}
      <div className="h-16 flex items-center px-4 border-b border-gray-700 relative">
        <Link to="/dashboard" className="flex items-center group w-full">
          <div className="flex items-center w-full">
            <div className={`
              relative flex justify-center
              ${isCollapsed ? 'w-full' : 'w-10'}
              transition-all duration-300
            `}>
              <img 
                src={logo} 
                alt="M&V Abogados Logo" 
                className={`
                  h-10 w-auto flex-shrink-0
                  [filter:brightness(0)_invert(1)]
                  group-hover:[filter:brightness(0)_invert(0.8)]
                  transition-all duration-200
                `}
                style={{
                  objectFit: 'contain',
                  maxWidth: '100%'
                }}
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
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
        <nav className="space-y-1 px-3">
          {filteredMenuItems.map((item) => (
            <div key={item.title}>
              {item.subItems ? (
                <Disclosure defaultOpen={openMenus.includes(item.title)}>
                  {({ open }) => (
                    <>
                      <Disclosure.Button 
                        className={`
                          flex items-center w-full px-3 py-2 rounded-lg
                          transition-colors duration-200
                          ${open ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}
                        `}
                      >
                        <item.icon className={`h-5 w-5 ${open ? 'text-white' : 'text-gray-400'}`} />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3 flex-1 text-left whitespace-nowrap">{item.title}</span>
                            <ChevronDownIcon
                              className={`${open ? 'transform rotate-180' : ''} w-5 h-5 transition-transform`}
                            />
                          </>
                        )}
                      </Disclosure.Button>
                      <Disclosure.Panel className="mt-1 ml-2">
                        {!isCollapsed && renderSubItems(item.subItems)}
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ) : (
                <button
                  onClick={() => navigate(item.path!)}
                  className={`
                    flex items-center w-full px-3 py-2 rounded-lg
                    transition-colors duration-200
                    ${location.pathname === item.path
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon className={`
                    h-5 w-5
                    ${location.pathname === item.path ? 'text-white' : 'text-gray-400'}
                  `} />
                  {!isCollapsed && (
                    <span className="ml-3 whitespace-nowrap">{item.title}</span>
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Botón de colapsar sidebar */}
      <div className="border-t border-gray-700 p-4">
        <button
          onClick={toggleSidebar}
          className={`
            w-full p-2.5 rounded-lg text-gray-400 hover:text-white
            bg-gray-700/50 hover:bg-gray-600 
            transition-all duration-200 flex items-center justify-center
            md:flex hidden group
          `}
        >
          <ChevronDoubleLeftIcon className={`
            h-5 w-5 transition-all duration-200
            ${isCollapsed ? 'rotate-180' : ''}
            group-hover:scale-110
          `} />
          {!isCollapsed && (
            <span className="ml-2 text-sm">Colapsar menú</span>
          )}
        </button>
      </div>
    </motion.div>
  );
}; 