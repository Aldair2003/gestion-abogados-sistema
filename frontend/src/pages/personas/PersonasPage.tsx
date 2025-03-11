import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import PersonasList from '../../components/personas/PersonasList';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface Canton {
  id: number;
  nombre: string;
  codigo: string;
}

const PersonasPage: React.FC = () => {
  const { cantonId } = useParams<{ cantonId: string }>();
  const { isDarkMode } = useTheme();
  const [canton, setCanton] = useState<Canton | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCanton = async () => {
      if (!cantonId) {
        setError('No se ha especificado un cantón');
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/cantones/${cantonId}`);
        if (response.data?.data) {
          setCanton(response.data.data);
        }
      } catch (error: any) {
        console.error('Error cargando cantón:', error);
        setError('Error al cargar la información del cantón');
        toast.error('Error al cargar la información del cantón');
      } finally {
        setLoading(false);
      }
    };

    loadCanton();
  }, [cantonId]);

  if (!cantonId) {
    return <Navigate to="/cantones" replace />;
  }

  if (loading) {
    return (
      <div className={`p-4 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Cargando...
      </div>
    );
  }

  if (error || !canton) {
    return (
      <div className={`p-4 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
        {error || 'No se encontró el cantón'}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Lista de personas */}
      <PersonasList 
        cantonId={cantonId} 
        searchTerm={searchTerm}
        cantonNombre={canton.nombre}
        cantonCodigo={canton.codigo}
        onSearchChange={setSearchTerm}
      />
    </div>
  );
};

export default PersonasPage; 