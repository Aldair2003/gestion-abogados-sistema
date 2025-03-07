import React from 'react';
import { 
  TableCellsIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-toastify';

interface ExportUsersProps {
  filters: any; // Usaremos los mismos filtros de la lista
}

export const ExportUsers = ({ filters }: ExportUsersProps) => {
  const handleExportExcel = async () => {
    try {
      const response = await api.get('/users/export/excel', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `usuarios_${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Exportación a Excel completada');
    } catch (error) {
      toast.error('Error al exportar a Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/users/export/pdf', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `usuarios_${new Date().toISOString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Exportación a PDF completada');
    } catch (error) {
      toast.error('Error al exportar a PDF');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportExcel}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg
                 hover:bg-green-700 transition-colors duration-200"
      >
        <TableCellsIcon className="h-5 w-5" />
        Excel
      </button>
      
      <button
        onClick={handleExportPDF}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg
                 hover:bg-red-700 transition-colors duration-200"
      >
        <DocumentTextIcon className="h-5 w-5" />
        PDF
      </button>
    </div>
  );
}; 