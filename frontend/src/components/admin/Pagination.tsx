import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  // Calcular el rango de páginas a mostrar
  const getPageRange = () => {
    const range = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white/80 dark:bg-dark-800/80 rounded-2xl shadow-lg 
                 border border-gray-200/20 dark:border-dark-700/20
                 backdrop-blur-sm p-4"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span className="text-sm font-medium">
            Página {currentPage} de {totalPages}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative group p-2 rounded-xl
                     bg-gradient-to-br from-gray-50 to-gray-100 
                     dark:from-dark-700 dark:to-dark-600
                     disabled:from-gray-100 disabled:to-gray-100
                     dark:disabled:from-dark-800 dark:disabled:to-dark-800
                     border border-gray-200 dark:border-dark-600
                     disabled:border-gray-200 dark:disabled:border-dark-700
                     shadow-sm hover:shadow-md disabled:shadow-none
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-300 
                                      group-hover:text-primary-500 dark:group-hover:text-primary-400
                                      transition-colors duration-200" />
            <span className="sr-only">Anterior</span>
          </motion.button>

          <AnimatePresence mode='wait'>
            <div className="hidden sm:flex items-center gap-1">
              {getPageRange().map((pageNum) => (
                <motion.button
                  key={pageNum}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onPageChange(pageNum)}
                  className={`
                    relative px-4 py-2 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${currentPage === pageNum
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-700 dark:to-dark-600 text-gray-700 dark:text-gray-300 hover:shadow-md'
                    }
                    ${currentPage === pageNum
                      ? 'border-2 border-primary-400 dark:border-primary-500'
                      : 'border border-gray-200 dark:border-dark-600'
                    }
                  `}
                >
                  {pageNum}
                </motion.button>
              ))}
            </div>
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative group p-2 rounded-xl
                     bg-gradient-to-br from-gray-50 to-gray-100 
                     dark:from-dark-700 dark:to-dark-600
                     disabled:from-gray-100 disabled:to-gray-100
                     dark:disabled:from-dark-800 dark:disabled:to-dark-800
                     border border-gray-200 dark:border-dark-600
                     disabled:border-gray-200 dark:disabled:border-dark-700
                     shadow-sm hover:shadow-md disabled:shadow-none
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-gray-300 
                                       group-hover:text-primary-500 dark:group-hover:text-primary-400
                                       transition-colors duration-200" />
            <span className="sr-only">Siguiente</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}; 