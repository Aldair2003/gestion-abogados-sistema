import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { motion } from 'framer-motion';
import { useState } from 'react';

export const MainLayout = () => {
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1729]">
      <div className="flex h-screen overflow-hidden">
        {/* Overlay para móviles */}
        <div 
          className={`
            fixed inset-0 bg-black/50 z-[50]
            md:hidden transition-all duration-300
            ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar con overlay para móviles */}
        <div className={`
          md:relative fixed inset-y-0 left-0 z-[60]
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:h-screen h-[100dvh]
        `}>
          <Sidebar 
            isOpen={isSidebarOpen} 
            onToggle={toggleSidebar}
            className="h-full"
          />
        </div>

        <motion.div 
          className="flex-1 flex flex-col min-w-0 relative"
          layout
          transition={{
            duration: 0.15,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <Header 
            className={`z-[55] bg-white/95 dark:bg-[#1a2234]/80 
                     border-b border-gray-200 dark:border-dark-700/20 
                     backdrop-blur-md shadow-sm sticky top-0
                     transition-all duration-300 ease-in-out
                     ${isSidebarOpen ? 'md:pl-4' : 'pl-4'}`}
            onMenuClick={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
          
          <motion.main 
            className={`flex-1 ${isSettingsPage ? '' : 'overflow-y-auto'}
                     bg-gradient-to-br from-gray-50 to-gray-100 
                     dark:from-[#0f1729] dark:to-[#0f1729]
                     ${isSidebarOpen ? 'md:ml-0' : ''}`}
            layout
            transition={{
              duration: 0.15,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <motion.div 
              className={`
                h-full 
                ${isSettingsPage ? 'p-0' : 'px-4 sm:px-6 py-6 sm:py-8'} 
                max-w-full
              `}
              layout
              transition={{
                duration: 0.15,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <Outlet />
            </motion.div>
          </motion.main>
        </motion.div>
      </div>
    </div>
  );
}; 