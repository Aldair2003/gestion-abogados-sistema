import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { motion } from 'framer-motion';

export const MainLayout = () => {
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1729]">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        
        <motion.div 
          className="flex-1 flex flex-col min-w-0"
          layout
          transition={{
            duration: 0.15,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <Header className="z-[9000] bg-white/95 dark:bg-[#1a2234]/80 
                           border-b border-gray-200 dark:border-dark-700/20 
                           backdrop-blur-md shadow-sm sticky top-0" />
          
          <motion.main 
            className={`flex-1 ${isSettingsPage ? '' : 'overflow-y-auto'}
                     bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f1729] dark:to-[#0f1729]`}
            layout
            transition={{
              duration: 0.15,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <motion.div 
              className={`h-full ${isSettingsPage ? 'p-0' : 'px-6 py-8'} max-w-full`}
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