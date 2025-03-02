export const getApiUrl = (path: string): string => {
  // Intentar obtener la URL de la API de diferentes variables de entorno
  const apiUrl = import.meta.env?.VITE_API_URL || 
                process.env.REACT_APP_API_URL || 
                'http://localhost:3000/api';
  
  return `${apiUrl}${path}`;
};

export const getPhotoUrl = (photoUrl: string | undefined | null): string => {
  if (!photoUrl) return '';
  
  // Si la URL ya es completa (comienza con http:// o https://), retornarla directamente
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }

  // Obtener la URL base sin el sufijo /api
  const baseUrl = (import.meta.env?.VITE_API_URL || 
                  process.env.REACT_APP_API_URL || 
                  'http://localhost:3000').replace('/api', '');
  
  // Si la URL de la foto comienza con /, usarla directamente, si no, añadir /
  return `${baseUrl}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
}; 