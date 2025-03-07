export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'No especificado';
  
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}; 