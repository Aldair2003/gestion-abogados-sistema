import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField } from '../common/TextField';
import { SelectField } from '../common/SelectField';
import { EstadoProfesional } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface CompleteProfileFormProps {
  onProfileCompleted: () => void;
  compact?: boolean;
  disabled?: boolean;
}

const profileSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .transform(val => val.trim()),
  cedula: z.string()
    .min(10, 'La cédula debe tener 10 dígitos')
    .max(10, 'La cédula debe tener 10 dígitos')
    .regex(/^\d{10}$/, 'La cédula debe contener solo números')
    .transform(val => val.trim()),
  telefono: z.string()
    .min(10, 'El teléfono debe tener 10 dígitos')
    .max(10, 'El teléfono debe tener 10 dígitos')
    .regex(/^\d{10}$/, 'El teléfono debe contener solo números')
    .transform(val => val.trim()),
  domicilio: z.string()
    .min(1, 'El domicilio es requerido')
    .transform(val => val.trim()),
  estadoProfesional: z.nativeEnum(EstadoProfesional, {
    required_error: 'El estado profesional es requerido'
  }),
  numeroMatricula: z.string()
    .nullable()
    .optional()
    .transform(val => val ? val.trim() : undefined),
  universidad: z.string()
    .nullable()
    .optional()
    .transform(val => val ? val.trim() : undefined)
}).superRefine((data, ctx) => {
  if (data.estadoProfesional === EstadoProfesional.GRADUADO) {
    if (!data.numeroMatricula) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número de matrícula es requerido para abogados graduados',
        path: ['numeroMatricula']
      });
    } else if (!/^[A-Z0-9]{2}-[A-Z0-9]{4}-[A-Z0-9]{3}/.test(data.numeroMatricula)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El formato debe ser XX-XXXX-XXX',
        path: ['numeroMatricula']
      });
    }
  }
  
  if ((data.estadoProfesional === EstadoProfesional.GRADUADO || 
       data.estadoProfesional === EstadoProfesional.ESTUDIANTE) && 
      !data.universidad) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La universidad es requerida',
      path: ['universidad']
    });
  }
});

type FormValues = z.infer<typeof profileSchema>;

export const CompleteProfileForm: React.FC<CompleteProfileFormProps> = ({ 
  onProfileCompleted,
  compact = false,
  disabled = false
}) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatMatricula = (value: string) => {
    if (!value) return '';
    const baseFormat = value.substring(0, 11);
    const additional = value.substring(11);
    
    let formatted = '';
    const cleaned = baseFormat.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    if (cleaned.length > 0) {
      formatted = cleaned.slice(0, 2);
      if (cleaned.length > 2) {
        formatted += '-' + cleaned.slice(2, 6);
      }
      if (cleaned.length > 6) {
        formatted += '-' + cleaned.slice(6, 9);
      }
    }
    
    return formatted + additional;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError
  } = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: user?.nombre || '',
      cedula: user?.cedula || '',
      telefono: user?.telefono || '',
      domicilio: user?.domicilio || '',
      estadoProfesional: user?.estadoProfesional || undefined,
      numeroMatricula: user?.numeroMatricula || '',
      universidad: user?.universidad || ''
    }
  });

  const estadoProfesional = watch('estadoProfesional');

  const onSubmit = async (data: FormValues) => {
    if (disabled) return;
    
    try {
      setLoading(true);

      const formattedData = {
        nombre: data.nombre.trim(),
        cedula: data.cedula.trim(),
        telefono: data.telefono.trim(),
        domicilio: data.domicilio.trim(),
        estadoProfesional: data.estadoProfesional,
        numeroMatricula: data.estadoProfesional === EstadoProfesional.GRADUADO ? data.numeroMatricula?.trim() : undefined,
        universidad: (data.estadoProfesional === EstadoProfesional.GRADUADO || 
                     data.estadoProfesional === EstadoProfesional.ESTUDIANTE) ? 
                     data.universidad?.trim() : undefined
      };

      const response = await api.post('/users/complete-profile', formattedData);
      
      if (user) {
        const updatedUser = {
          ...user,
          ...response.data,
          isProfileCompleted: true
        };
        await updateUser(updatedUser);
      }

      toast.success('Perfil completado exitosamente');
      onProfileCompleted();
    } catch (error: any) {
      console.error('Error completing profile:', error);
      const errorMessage = error.response?.data?.message || 'Error al completar el perfil';
      
      if (error.response?.data?.error === 'DUPLICATE_CEDULA') {
        setError('cedula', { 
          message: 'Esta cédula ya está registrada para otro usuario' 
        });
      } else if (error.response?.data?.error) {
        switch (error.response.data.error) {
          case 'INVALID_CEDULA':
            setError('cedula', { message: 'Cédula inválida' });
            break;
          case 'INVALID_PHONE':
            setError('telefono', { message: 'Formato de teléfono inválido' });
            break;
          case 'MISSING_UNIVERSITY':
            setError('universidad', { message: 'La universidad es requerida' });
            break;
          case 'MISSING_MATRICULA':
            setError('numeroMatricula', { message: 'El número de matrícula es requerido' });
            break;
          case 'INVALID_MATRICULA_FORMAT':
            setError('numeroMatricula', { message: 'Formato de matrícula inválido' });
            break;
          default:
            toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div className="space-y-2">
        {/* Nombre Completo */}
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <input
              type="text"
              {...register('nombre')}
              className={`block w-full pl-10 pr-3 py-2 text-sm
                border ${errors.nombre ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                bg-white/70 dark:bg-gray-900/70
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="Nombre Completo"
              disabled={disabled}
            />
          </div>
          {errors.nombre && (
            <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>
          )}
        </div>

        {/* Cédula y Teléfono */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
                </svg>
              </div>
              <input
                type="text"
                {...register('cedula')}
                className={`block w-full pl-10 pr-3 py-2 text-sm
                  border ${errors.cedula ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                  bg-white/70 dark:bg-gray-900/70
                  text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Cédula"
                disabled={disabled}
              />
            </div>
            {errors.cedula && (
              <p className="mt-1 text-xs text-red-500">{errors.cedula.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </div>
              <input
                type="text"
                {...register('telefono')}
                className={`block w-full pl-10 pr-3 py-2 text-sm
                  border ${errors.telefono ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                  bg-white/70 dark:bg-gray-900/70
                  text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Teléfono"
                disabled={disabled}
              />
            </div>
            {errors.telefono && (
              <p className="mt-1 text-xs text-red-500">{errors.telefono.message}</p>
            )}
          </div>
        </div>

        {/* Domicilio */}
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <input
              type="text"
              {...register('domicilio')}
              className={`block w-full pl-10 pr-3 py-2 text-sm
                border ${errors.domicilio ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                bg-white/70 dark:bg-gray-900/70
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="Domicilio"
              disabled={disabled}
            />
          </div>
          {errors.domicilio && (
            <p className="mt-1 text-xs text-red-500">{errors.domicilio.message}</p>
          )}
        </div>

        {/* Estado Profesional */}
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
            </div>
            <select
              {...register('estadoProfesional')}
              className={`block w-full pl-10 pr-3 py-2 text-sm
                border ${errors.estadoProfesional ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                bg-white/70 dark:bg-gray-900/70
                text-gray-900 dark:text-white
                disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={disabled}
            >
              <option value="">Estado Profesional</option>
              <option value={EstadoProfesional.ESTUDIANTE}>Estudiante</option>
              <option value={EstadoProfesional.GRADUADO}>Graduado</option>
            </select>
          </div>
          {errors.estadoProfesional && (
            <p className="mt-1 text-xs text-red-500">{errors.estadoProfesional.message}</p>
          )}
        </div>

        {/* Campos condicionales */}
        {(estadoProfesional === EstadoProfesional.GRADUADO || 
          estadoProfesional === EstadoProfesional.ESTUDIANTE) && (
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                </svg>
              </div>
              <input
                type="text"
                {...register('universidad')}
                className={`block w-full pl-10 pr-3 py-2 text-sm
                  border ${errors.universidad ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                  bg-white/70 dark:bg-gray-900/70
                  text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Universidad"
                disabled={disabled}
              />
            </div>
            {errors.universidad && (
              <p className="mt-1 text-xs text-red-500">{errors.universidad.message}</p>
            )}
          </div>
        )}

        {estadoProfesional === EstadoProfesional.GRADUADO && (
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                </svg>
              </div>
              <input
                type="text"
                {...register('numeroMatricula')}
                onChange={(e) => {
                  const formatted = formatMatricula(e.target.value);
                  e.target.value = formatted;
                  setValue('numeroMatricula', formatted);
                }}
                className={`block w-full pl-10 pr-3 py-2 text-sm
                  border ${errors.numeroMatricula ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                  bg-white/70 dark:bg-gray-900/70
                  text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Número de Matrícula (XX-XXXX-XXX)"
                disabled={disabled}
              />
            </div>
            {errors.numeroMatricula && (
              <p className="mt-1 text-xs text-red-500">{errors.numeroMatricula.message}</p>
            )}
          </div>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={loading || disabled}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full px-4 py-2 bg-primary-600 text-white rounded-lg 
          hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed 
          flex items-center justify-center gap-2 mt-3
          text-sm`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Guardando...</span>
          </>
        ) : (
          'Completar Perfil'
        )}
      </motion.button>
    </form>
  );
}; 