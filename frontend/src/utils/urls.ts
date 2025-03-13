export const getApiUrl = (path: string): string => {
  const apiUrl = process.env.REACT_APP_API_URL || 
                (process.env.REACT_APP_ENV === 'development' 
                  ? 'http://localhost:3000/api'
                  : 'https://gestion-abogados-sistema-production.up.railway.app/api');
  
  return `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getPhotoUrl = (photoUrl: string | undefined | null): string => {
  if (!photoUrl) return '';
  
  // Si la URL ya es completa (incluyendo Cloudinary), retornarla directamente
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }

  // En producción, todas las imágenes deberían venir de Cloudinary
  if (process.env.REACT_APP_ENV === 'production') {
    // Si la URL no es de Cloudinary, usar un placeholder
    return `https://ui-avatars.com/api/?name=U&background=6366f1&color=fff`;
  }

  // En desarrollo, usar la URL local
  const baseUrl = 'http://localhost:3000';
  return `${baseUrl}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
}; 