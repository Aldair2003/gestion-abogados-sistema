import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

export const UserMenu = () => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button>
        {/* ... contenido del botón ... */}
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
        <Menu.Items 
          className="absolute right-0 mt-2 w-56 origin-top-right 
                     bg-white dark:bg-dark-800 
                     rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 
                     divide-y divide-gray-100 dark:divide-dark-700 
                     focus:outline-none
                     z-[9999]"
          style={{ position: 'fixed' }}
        >
          {/* ... contenido del menú ... */}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}; 