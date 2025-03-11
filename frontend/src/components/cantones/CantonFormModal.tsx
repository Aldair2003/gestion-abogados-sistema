import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

interface CantonFormData {
  nombre: string;
  codigo: string;
  imagen?: File;
}

interface CantonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CantonFormData) => void;
  initialData?: {
    id: number;
    nombre: string;
    codigo: string;
    imagenUrl?: string;
  };
}

const CantonFormModal: React.FC<CantonFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<CantonFormData>({
    nombre: '',
    codigo: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre,
        codigo: initialData.codigo,
      });
      if (initialData.imagenUrl) {
        const imageUrl = initialData.imagenUrl.startsWith('http') 
          ? initialData.imagenUrl 
          : `http://localhost:3000/uploads/cantones/${initialData.imagenUrl.split('/').pop()}`;
        setPreviewUrl(imageUrl);
      } else {
        setPreviewUrl('');
      }
    } else {
      setFormData({ nombre: '', codigo: '' });
      setPreviewUrl('');
    }
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imagen: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData((prev) => ({ ...prev, imagen: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido';
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.codigo)) {
      newErrors.codigo = 'El código solo puede contener letras, números y guiones';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-[9000]"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[8999]" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[9000]">
        <Dialog.Panel className={`w-full max-w-2xl rounded-2xl transform transition-all ${
          isDarkMode 
            ? 'bg-[#1a2234] border border-gray-700/50' 
            : 'bg-white border border-gray-200'
        } shadow-2xl`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700/50">
            <div>
              <Dialog.Title className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {initialData ? 'Editar Cantón' : 'Nuevo Cantón'}
              </Dialog.Title>
              <p className={`mt-1 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {initialData ? 'Modifica los datos del cantón' : 'Ingresa los datos del nuevo cantón'}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Nombre */}
            <div>
              <label
                htmlFor="nombre"
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                Nombre del Cantón
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                className={`block w-full rounded-lg border text-sm transition-colors ${
                  isDarkMode 
                    ? 'bg-[#0f1729] border-gray-700 text-white placeholder-gray-500 focus:border-primary-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500'
                } focus:ring-primary-500 px-4 py-2.5`}
                placeholder="Ingrese el nombre del cantón"
              />
              {errors.nombre && (
                <p className="mt-2 text-sm text-red-500">{errors.nombre}</p>
              )}
            </div>

            {/* Código */}
            <div>
              <label
                htmlFor="codigo"
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                Código
              </label>
              <input
                type="text"
                id="codigo"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, codigo: e.target.value }))
                }
                className={`block w-full rounded-lg border text-sm transition-colors ${
                  isDarkMode 
                    ? 'bg-[#0f1729] border-gray-700 text-white placeholder-gray-500 focus:border-primary-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500'
                } focus:ring-primary-500 px-4 py-2.5`}
                placeholder="Ingrese el código del cantón"
              />
              {errors.codigo && (
                <p className="mt-2 text-sm text-red-500">{errors.codigo}</p>
              )}
            </div>

            {/* Imagen */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                Imagen
                <span className={`ml-2 text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  (JPG, PNG, GIF, WEBP, AVIF - Max. 5MB)
                </span>
              </label>
              
              <div 
                className={`mt-2 flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                  isDarkMode 
                    ? `bg-[#0f1729] ${isDragging ? 'border-primary-500' : 'border-gray-700'} hover:border-gray-600` 
                    : `bg-gray-50 ${isDragging ? 'border-primary-500' : 'border-gray-300'} hover:border-gray-400`
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('imagen')?.click()}
              >
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="w-40 h-40 object-cover rounded-lg"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/assets/images/placeholder-canton.jpg';
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewUrl('');
                        setFormData((prev) => ({ ...prev, imagen: undefined }));
                      }}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={`p-3 rounded-full mb-4 ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <input
                        id="imagen"
                        name="imagen"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                        onChange={handleImageChange}
                      />
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-white hover:text-primary-300' : 'text-primary-600 hover:text-primary-500'
                      }`}>
                        Subir imagen
                      </p>
                      <p className={`mt-1 text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-500'
                      }`}>
                        o arrastra y suelta
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {initialData ? 'Guardar cambios' : 'Crear cantón'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CantonFormModal; 