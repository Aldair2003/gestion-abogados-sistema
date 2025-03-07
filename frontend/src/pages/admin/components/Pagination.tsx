import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10
}: PaginationProps) => {
  // Validar y normalizar los valores
  const validCurrentPage = isNaN(currentPage) || currentPage < 1 ? 1 : currentPage;
  const validTotalPages = isNaN(totalPages) || totalPages < 1 ? 1 : totalPages;
  const validTotalItems = isNaN(totalItems) || totalItems < 0 ? 0 : totalItems;
  const validItemsPerPage = isNaN(itemsPerPage) || itemsPerPage < 1 ? 10 : itemsPerPage;

  // Función para generar el rango de páginas a mostrar
  const getPageRange = () => {
    const range = [];
    const maxVisiblePages = 5;
    let start = Math.max(1, validCurrentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(validTotalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  // Calcular los índices de los elementos mostrados
  const firstItemIndex = Math.min((validCurrentPage - 1) * validItemsPerPage + 1, validTotalItems);
  const lastItemIndex = Math.min(validCurrentPage * validItemsPerPage, validTotalItems);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#172133]
                 border-t border-gray-200/50 dark:border-gray-700/30 rounded-b-2xl"
    >
      {/* Vista móvil */}
      <div className="flex-1 flex justify-between sm:hidden">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl
                   text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1d2842]
                   border border-gray-300/50 dark:border-gray-700/50
                   hover:bg-gray-50 dark:hover:bg-[#1d2842]/80
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-sm"
        >
          Anterior
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage === validTotalPages}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl
                   text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1d2842]
                   border border-gray-300/50 dark:border-gray-700/50
                   hover:bg-gray-50 dark:hover:bg-[#1d2842]/80
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-sm"
        >
          Siguiente
        </motion.button>
      </div>

      {/* Vista desktop */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando{' '}
            <span className="font-medium text-gray-900 dark:text-white">{firstItemIndex}</span>
            {' '}-{' '}
            <span className="font-medium text-gray-900 dark:text-white">{lastItemIndex}</span>
            {' '}de{' '}
            <span className="font-medium text-gray-900 dark:text-white">{validTotalItems}</span>
            {' '}resultados
          </p>
        </div>

        <div>
          <nav className="relative z-0 inline-flex gap-2" aria-label="Pagination">
            {/* Botón Anterior */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPageChange(validCurrentPage - 1)}
              disabled={validCurrentPage === 1}
              className="relative inline-flex items-center p-2 rounded-lg
                       text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1d2842]
                       border border-gray-300/50 dark:border-gray-700/50
                       hover:bg-gray-50 dark:hover:bg-[#1d2842]/80
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-sm"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </motion.button>

            {/* Números de página */}
            {getPageRange().map((pageNum) => (
              <motion.button
                key={pageNum}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                          shadow-sm transition-all duration-200
                          ${validCurrentPage === pageNum
                            ? 'z-10 bg-primary-600 dark:bg-primary-500 text-white border border-primary-600 dark:border-primary-500'
                            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1d2842] border border-gray-300/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-[#1d2842]/80'
                          }`}
              >
                {pageNum}
              </motion.button>
            ))}

            {/* Botón Siguiente */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPageChange(validCurrentPage + 1)}
              disabled={validCurrentPage === validTotalPages}
              className="relative inline-flex items-center p-2 rounded-lg
                       text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1d2842]
                       border border-gray-300/50 dark:border-gray-700/50
                       hover:bg-gray-50 dark:hover:bg-[#1d2842]/80
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-sm"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </motion.button>
          </nav>
        </div>
      </div>
    </motion.div>
  );
}; 