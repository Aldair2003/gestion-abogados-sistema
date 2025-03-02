import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1729]">
      <div className="flex h-screen">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <Header className="z-[9000] bg-white/95 dark:bg-[#1a2234]/80 
                           border-b border-gray-200 dark:border-dark-700/20 
                           backdrop-blur-md shadow-sm" />
          
          <main className="flex-1 overflow-y-auto
                         bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f1729] dark:to-[#0f1729]">
            <div className="h-full pl-6 pr-0 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}; 