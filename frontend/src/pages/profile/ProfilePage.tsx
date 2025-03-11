import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { PencilIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowCircleRightIcon, AtSymbolIcon, UserIcon, AcademicCapIcon, CameraIcon } from '../../components/icons/CustomIcons';
import { showToast } from '../../utils/toast';
import { getPhotoUrl } from '../../utils/urls';
import api from '../../services/api';
import { EstadoProfesional } from '../../types/user';
import { User } from '../../types/user';

interface ProfileFormData {
  nombre: string;
  cedula: string;
  telefono: string;
  domicilio: string;
  estadoProfesional?: EstadoProfesional;
  numeroMatricula?: string;
  universidad?: string;
  tempPhotoUrl?: string;
  photoFile?: File;
}

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: user?.nombre || '',
    cedula: user?.cedula || '',
    telefono: user?.telefono || '',
    domicilio: user?.domicilio || '',
    estadoProfesional: user?.estadoProfesional,
    numeroMatricula: user?.numeroMatricula,
    universidad: user?.universidad
  });

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/users/me');
        if (response.data) {
          updateUser(response.data);
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };
    fetchUserData();
  }, [updateUser]);

  // Actualizar formData cuando el usuario cambie
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        cedula: user.cedula || '',
        telefono: user.telefono || '',
        domicilio: user.domicilio || '',
        estadoProfesional: user.estadoProfesional,
        numeroMatricula: user.numeroMatricula,
        universidad: user.universidad
      });
    }
  }, [user]);

  const formatRol = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'Administrador';
      case 'COLABORADOR':
        return 'Colaborador';
      default:
        return rol;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setFormData({
      nombre: user?.nombre || '',
      cedula: user?.cedula || '',
      telefono: user?.telefono || '',
      domicilio: user?.domicilio || '',
      estadoProfesional: user?.estadoProfesional,
      numeroMatricula: user?.numeroMatricula,
      universidad: user?.universidad
    });
    setIsEditing(false);
    showToast.warning('Cambios Cancelados', 'Los cambios han sido descartados');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar el tipo y tamaño del archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast.error('Error', 'Solo se permiten archivos de imagen (JPG, PNG, GIF)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast.error('Error', 'La imagen no debe superar los 5MB');
      return;
    }

    // Crear un objeto URL temporal para previsualizar la imagen
    const tempUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      tempPhotoUrl: tempUrl,
      photoFile: file
    }));

    // Activar modo de edición si no está activo
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setIsUpdating(true);
      setShowContent(false);

      // Asegurarnos de que tenemos todos los campos requeridos
      if (!user?.id) {
        throw new Error('Usuario no válido');
      }

      let updatedUserData: User = {
        ...user,
        isProfileCompleted: true
      };

      // Si hay una foto nueva para subir
      if (formData.photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', formData.photoFile);

        const photoResponse = await api.post('/users/me/photo', photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (photoResponse.data) {
          updatedUserData = {
            ...updatedUserData,
            ...photoResponse.data,
            photoUrl: photoResponse.data.photoUrl,
            id: user.id, // Mantener el ID original
            isProfileCompleted: true
          };
          await updateUser(updatedUserData);
        }
      }

      // Procesar otros cambios si los hay
      const changedFields = Object.entries(formData).reduce<Partial<ProfileFormData>>((acc, [key, value]) => {
        if (key !== 'tempPhotoUrl' && key !== 'photoFile' && value !== user?.[key as keyof typeof user]) {
          acc[key as keyof ProfileFormData] = value;
        }
        return acc;
      }, {});

      if (Object.keys(changedFields).length > 0) {
        const response = await api.put('/users/me/profile', changedFields);
        if (response.data) {
          updatedUserData = {
            ...updatedUserData,
            ...response.data,
            photoUrl: formData.photoFile ? response.data.photoUrl : updatedUserData.photoUrl,
            id: user.id, // Mantener el ID original
            isProfileCompleted: true
          };
          await updateUser(updatedUserData);
        }
      }

      // Actualizar el estado local con los datos actualizados
      setFormData({
        nombre: updatedUserData.nombre || '',
        cedula: updatedUserData.cedula || '',
        telefono: updatedUserData.telefono || '',
        domicilio: updatedUserData.domicilio || '',
        estadoProfesional: updatedUserData.estadoProfesional,
        numeroMatricula: updatedUserData.numeroMatricula,
        universidad: updatedUserData.universidad
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      
      showToast.success('Perfil Actualizado', 'Sus datos han sido actualizados exitosamente');
      setIsEditing(false);
      setShowContent(true);

      if (formData.tempPhotoUrl) {
        URL.revokeObjectURL(formData.tempPhotoUrl);
      }
      setFormData(prev => ({
        ...prev,
        tempPhotoUrl: undefined,
        photoFile: undefined
      }));

      // Forzar una actualización de los datos del usuario
      const refreshResponse = await api.get('/users/me');
      if (refreshResponse.data) {
        await updateUser(refreshResponse.data);
      }
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      showToast.error(
        'Error en la Actualización',
        error.response?.data?.message || 'No se pudo actualizar el perfil. Por favor, intente nuevamente.'
      );
      setShowContent(true);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  if (!showContent || isUpdating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full border-4 border-primary-500/30 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <ArrowCircleRightIcon className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            Actualizando perfil...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="profile-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Encabezado del perfil */}
        <div className="bg-white/70 dark:bg-[#172133] backdrop-blur-xl rounded-2xl shadow-xl 
                     border border-white/50 dark:border-gray-700/30 p-8 relative
                     hover:shadow-2xl hover:bg-white/80 dark:hover:bg-[#172133]/95
                     transition-all duration-300">
          <div className="absolute top-8 right-8 flex gap-2">
            {isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                         text-gray-700 dark:text-gray-200 
                         bg-gray-100 dark:bg-gray-800
                         hover:bg-gray-200 dark:hover:bg-gray-700
                         border border-gray-200/50 dark:border-gray-700/50
                         shadow-lg shadow-gray-200/20 dark:shadow-none
                         transition-all duration-200"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Cancelar</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isEditing ? handleSubmit : () => setIsEditing(true)}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                       ${isEditing 
                         ? 'text-white bg-primary-500 hover:bg-primary-600 border-primary-400'
                         : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1d2842] hover:bg-gray-50 dark:hover:bg-[#1d2842]/80 border-gray-200/50 dark:border-gray-700/50'
                       }
                       border shadow-lg shadow-primary-500/20 dark:shadow-none
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : isEditing ? (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Guardar cambios</span>
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4" />
                  <span>Editar perfil</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Información principal */}
          <div className="flex items-start gap-8">
            {/* Avatar con efecto de hover mejorado */}
            <div className="relative group">
              <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600
                            dark:from-primary-500/20 dark:to-primary-600/20
                            flex items-center justify-center overflow-hidden
                            ring-4 ring-white dark:ring-primary-500/10 shadow-xl
                            transition-all duration-300 group-hover:scale-105
                            group-hover:shadow-2xl group-hover:ring-primary-500/30">
                {(formData.tempPhotoUrl || user?.photoUrl) ? (
                  <img
                    src={formData.tempPhotoUrl || getPhotoUrl(user?.photoUrl)}
                    alt={user?.nombre || 'Usuario'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nombre || 'U')}&background=6366f1&color=fff`;
                    }}
                  />
                ) : (
                  <span className="text-4xl text-white font-medium transition-all duration-300 group-hover:scale-110">
                {user?.nombre?.charAt(0).toUpperCase()}
              </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center
                              bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100
                              transition-all duration-200 cursor-pointer">
                  {isEditing && (
                    <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                      <CameraIcon className="w-6 h-6 text-white" />
                      <span className="text-white text-sm font-medium text-center px-2">
                        {formData.tempPhotoUrl ? 'Haga clic para cambiar' : 'Haga clic para subir foto'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
              {!isEditing && user?.photoUrl && (
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full
                              bg-white dark:bg-[#1d2842]
                              border border-gray-200/50 dark:border-gray-700/50
                              shadow-lg shadow-gray-200/20 dark:shadow-none
                              transition-all duration-200 hover:scale-110
                              hover:bg-primary-50 dark:hover:bg-primary-900/20">
                  <CameraIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Información básica */}
            <div>
              <motion.h1 
                whileHover={{ scale: 1.02 }}
                className="text-2xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300">
                {user?.nombre || 'Usuario'}
              </motion.h1>
              <div className="mt-2 flex items-center gap-3">
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium
                             bg-purple-100/80 dark:bg-purple-500/10
                             text-purple-700 dark:text-purple-400
                             border border-purple-200 dark:border-purple-500/20
                             shadow-sm shadow-purple-500/5
                             hover:bg-purple-200/80 dark:hover:bg-purple-500/20
                             transition-all duration-300">
                  {formatRol(user?.rol || '')}
                </motion.span>
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm
                              ${user?.isActive 
                                ? 'bg-green-100/80 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20 shadow-green-500/5 hover:bg-green-200/80 dark:hover:bg-green-500/20'
                                : 'bg-red-100/80 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20 shadow-red-500/5 hover:bg-red-200/80 dark:hover:bg-red-500/20'}
                              border transition-all duration-300`}>
                  {user?.isActive ? 'Activo' : 'Inactivo'}
                </motion.span>
              </div>
              <motion.p 
                whileHover={{ scale: 1.02 }}
                className="mt-3 text-gray-600 dark:text-gray-400 flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300">
                <span className="inline-block p-1 rounded-md bg-gray-100 dark:bg-gray-700/30">
                  <AtSymbolIcon className="w-4 h-4" />
                </span>
                {user?.email}
              </motion.p>
            </div>
          </div>

          {/* Secciones de información */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Información Personal */}
            <div className="space-y-5">
              <motion.h3 
                whileHover={{ scale: 1.02 }}
                className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300">
                <span className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/30">
                  <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </span>
                Información Personal
              </motion.h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#1d2842]/50
                              backdrop-blur-sm group
                              border border-gray-200/50 dark:border-gray-700/30
                              shadow-sm hover:shadow-md hover:bg-gray-50/80
                              transition-all duration-200">
                  <motion.p 
                    whileHover={{ scale: 1.01 }}
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                    Nombre completo
                  </motion.p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg text-sm
                               bg-white dark:bg-[#1d2842]
                               border border-gray-300 dark:border-gray-700
                               text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-primary-500/20
                               focus:border-primary-500
                               transition-all duration-200"
                      placeholder="Ingrese su nombre completo"
                    />
                  ) : (
                    <motion.p 
                      whileHover={{ scale: 1.01 }}
                      className="mt-1.5 text-sm text-gray-900 dark:text-white font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      {user?.nombre || 'No especificado'}
                    </motion.p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#1d2842]/50
                              backdrop-blur-sm group
                              border border-gray-200/50 dark:border-gray-700/30
                              shadow-sm hover:shadow-md hover:bg-gray-50/80
                              transition-all duration-200">
                  <motion.p 
                    whileHover={{ scale: 1.01 }}
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                    Cédula
                  </motion.p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg text-sm
                               bg-white dark:bg-[#1d2842]
                               border border-gray-300 dark:border-gray-700
                               text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-primary-500/20
                               focus:border-primary-500
                               transition-all duration-200"
                      placeholder="Ingrese su cédula"
                    />
                  ) : (
                    <motion.p 
                      whileHover={{ scale: 1.01 }}
                      className="mt-1.5 text-sm text-gray-900 dark:text-white font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      {user?.cedula || 'No especificada'}
                    </motion.p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#1d2842]/50
                              backdrop-blur-sm group
                              border border-gray-200/50 dark:border-gray-700/30
                              shadow-sm hover:shadow-md hover:bg-gray-50/80
                              transition-all duration-200">
                  <motion.p 
                    whileHover={{ scale: 1.01 }}
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                    Teléfono
                  </motion.p>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg text-sm
                               bg-white dark:bg-[#1d2842]
                               border border-gray-300 dark:border-gray-700
                               text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-primary-500/20
                               focus:border-primary-500
                               transition-all duration-200"
                      placeholder="Ingrese su teléfono"
                    />
                  ) : (
                    <motion.p 
                      whileHover={{ scale: 1.01 }}
                      className="mt-1.5 text-sm text-gray-900 dark:text-white font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      {user?.telefono || 'No especificado'}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>

            {/* Información Académica/Profesional */}
            <div className="space-y-5">
              <motion.h3 
                whileHover={{ scale: 1.02 }}
                className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300">
                <span className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/30">
                  <AcademicCapIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </span>
                Información Académica/Profesional
              </motion.h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#1d2842]/50
                              backdrop-blur-sm group
                              border border-gray-200/50 dark:border-gray-700/30
                              shadow-sm hover:shadow-md hover:bg-gray-50/80
                              transition-all duration-200">
                  <motion.p 
                    whileHover={{ scale: 1.01 }}
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                    Estado Profesional
                  </motion.p>
                  {isEditing ? (
                    <select
                      name="estadoProfesional"
                      value={formData.estadoProfesional || ''}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg text-sm
                               bg-white dark:bg-[#1d2842]
                               border border-gray-300 dark:border-gray-700
                               text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-primary-500/20
                               focus:border-primary-500
                               transition-all duration-200"
                    >
                      <option value="">Seleccione un estado</option>
                      <option value="ESTUDIANTE">Estudiante</option>
                      <option value="GRADUADO">Graduado</option>
                    </select>
                  ) : (
                    <motion.p 
                      whileHover={{ scale: 1.01 }}
                      className="mt-1.5 text-sm text-gray-900 dark:text-white font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      {user?.estadoProfesional || 'No especificado'}
                    </motion.p>
                  )}
                </div>

                {(formData.estadoProfesional === 'ESTUDIANTE' || user?.universidad) && (
                  <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#1d2842]/50
                                backdrop-blur-sm group
                                border border-gray-200/50 dark:border-gray-700/30
                                shadow-sm hover:shadow-md hover:bg-gray-50/80
                                transition-all duration-200">
                    <motion.p 
                      whileHover={{ scale: 1.01 }}
                      className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      Universidad
                    </motion.p>
                    {isEditing ? (
                      <input
                        type="text"
                        name="universidad"
                        value={formData.universidad || ''}
                        onChange={handleInputChange}
                        className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg text-sm
                                 bg-white dark:bg-[#1d2842]
                                 border border-gray-300 dark:border-gray-700
                                 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-primary-500/20
                                 focus:border-primary-500
                                 transition-all duration-200"
                        placeholder="Nombre de la universidad"
                      />
                    ) : (
                      <motion.p 
                        whileHover={{ scale: 1.01 }}
                        className="mt-1.5 text-sm text-gray-900 dark:text-white font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                        {user?.universidad || 'No especificada'}
                      </motion.p>
                    )}
                  </div>
                )}

                {(formData.estadoProfesional === 'GRADUADO' || user?.numeroMatricula) && (
                  <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#1d2842]/50
                                backdrop-blur-sm group
                                border border-gray-200/50 dark:border-gray-700/30
                                shadow-sm hover:shadow-md hover:bg-gray-50/80
                                transition-all duration-200">
                    <motion.p 
                      whileHover={{ scale: 1.01 }}
                      className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      Número de Matrícula
                    </motion.p>
                    {isEditing ? (
                      <input
                        type="text"
                        name="numeroMatricula"
                        value={formData.numeroMatricula || ''}
                        onChange={handleInputChange}
                        className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg text-sm
                                 bg-white dark:bg-[#1d2842]
                                 border border-gray-300 dark:border-gray-700
                                 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-primary-500/20
                                 focus:border-primary-500
                                 transition-all duration-200"
                        placeholder="Número de matrícula profesional"
                      />
                    ) : (
                      <motion.p 
                        whileHover={{ scale: 1.01 }}
                        className="mt-1.5 text-sm text-gray-900 dark:text-white font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                        {user?.numeroMatricula || 'No especificado'}
                      </motion.p>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#1d2842]/50
                              backdrop-blur-sm group
                              border border-gray-200/50 dark:border-gray-700/30
                              shadow-sm hover:shadow-md hover:bg-gray-50/80
                              transition-all duration-200">
                  <motion.p 
                    whileHover={{ scale: 1.01 }}
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                    Domicilio
                  </motion.p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="domicilio"
                      value={formData.domicilio || ''}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg text-sm
                               bg-white dark:bg-[#1d2842]
                               border border-gray-300 dark:border-gray-700
                               text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-primary-500/20
                               focus:border-primary-500
                               transition-all duration-200"
                      placeholder="Dirección de domicilio"
                    />
                  ) : (
                    <motion.p 
                      whileHover={{ scale: 1.01 }}
                      className="mt-1.5 text-sm text-gray-900 dark:text-white font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      {user?.domicilio || 'No especificado'}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 