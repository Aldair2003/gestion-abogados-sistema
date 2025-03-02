import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface MenuItem {
  title: string;
  path?: string;
  icon: string;
  subItems?: {
    title: string;
    path: string;
  }[];
}

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    const savedMenus = localStorage.getItem('openMenus');
    if (savedMenus) {
      setOpenMenus(JSON.parse(savedMenus));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('openMenus', JSON.stringify(openMenus));
  }, [openMenus]);

  const menuItems: MenuItem[] = [
    {
      title: 'Usuarios',
      icon: '👥',
      subItems: [
        { title: 'Lista de Usuarios', path: '/usuarios' },
        { title: 'Roles y Permisos', path: '/usuarios/roles' }
      ]
    },
    {
      title: 'Expedientes',
      icon: '📁',
      subItems: [
        { title: 'Casos Activos', path: '/expedientes/activos' },
        { title: 'Casos Cerrados', path: '/expedientes/cerrados' },
        { title: 'Crear Caso', path: '/expedientes/crear' }
      ]
    },
    {
      title: 'Calendario',
      icon: '📅',
      path: '/calendario'
    }
  ];

  const renderSubItems = (subItems: MenuItem['subItems']) => {
    if (!subItems) return null;
    
    return subItems.map((subItem) => (
      <button
        key={subItem.path}
        onClick={() => navigate(subItem.path)}
        className={`w-full text-left px-4 py-2 text-sm rounded-lg ${
          location.pathname === subItem.path
            ? 'text-white bg-gray-700'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        {subItem.title}
      </button>
    ));
  };

  return (
    <div className="w-64 bg-[#1a1f2b] border-r border-gray-700">
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-8">MV Abogados</h1>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.title}>
              {item.subItems ? (
                <Disclosure defaultOpen={openMenus.includes(item.title)}>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                        <span className="mr-3">{item.icon}</span>
                        <span className="flex-1 text-left">{item.title}</span>
                        <ChevronDownIcon
                          className={`${
                            open ? 'transform rotate-180' : ''
                          } w-5 h-5 transition-transform`}
                        />
                      </Disclosure.Button>
                      <Disclosure.Panel className="pl-11 mt-1 space-y-1">
                        {renderSubItems(item.subItems)}
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ) : (
                <button
                  onClick={() => navigate(item.path!)}
                  className={`flex items-center w-full px-4 py-2 rounded-lg ${
                    location.pathname === item.path
                      ? 'text-white bg-gray-700'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}; 