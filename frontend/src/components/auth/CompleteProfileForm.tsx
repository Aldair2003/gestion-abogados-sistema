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
    // Separar la parte del formato base (primeros 11 caracteres) del resto
    const baseFormat = value.substring(0, 11);
    const additional = value.substring(11);
    
    // Formatear la parte base
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
    
    // Agregar el resto del texto sin modificar
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
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error completing profile:', error);
      const errorMessage = error.response?.data?.message || 'Error al completar el perfil';
      
      if (error.response?.data?.error) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="col-span-2">
          <TextField
            label="Nombre Completo"
            {...register('nombre')}
            error={errors.nombre?.message}
            placeholder="Ingrese su nombre completo"
            compact={true}
            disabled={disabled}
          />
        </div>

        <TextField
          label="Cédula"
          {...register('cedula')}
          error={errors.cedula?.message}
          placeholder="Ingrese su número de cédula"
          compact={true}
          disabled={disabled}
        />

        <TextField
          label="Teléfono"
          {...register('telefono')}
          error={errors.telefono?.message}
          placeholder="Ingrese su número de teléfono"
          compact={true}
          disabled={disabled}
        />

        <div className="col-span-2">
          <TextField
            label="Domicilio"
            {...register('domicilio')}
            error={errors.domicilio?.message}
            placeholder="Ingrese su dirección de domicilio"
            compact={true}
            disabled={disabled}
          />
        </div>

        <div className="col-span-2">
          <SelectField
            label="Estado Profesional"
            {...register('estadoProfesional')}
            error={errors.estadoProfesional?.message}
            compact={true}
            disabled={disabled}
          >
            <option value="">Seleccione su estado profesional</option>
            <option value={EstadoProfesional.ESTUDIANTE}>Estudiante</option>
            <option value={EstadoProfesional.GRADUADO}>Graduado</option>
          </SelectField>
        </div>

        {(estadoProfesional === EstadoProfesional.ESTUDIANTE || estadoProfesional === EstadoProfesional.GRADUADO) && (
          <div className="col-span-2">
            <TextField
              label="Universidad"
              {...register('universidad')}
              error={errors.universidad?.message}
              placeholder="Ingrese su universidad"
              compact={true}
              disabled={disabled}
            />
          </div>
        )}

        {estadoProfesional === EstadoProfesional.GRADUADO && (
          <div className="col-span-2">
            <TextField
              label="Número de Matrícula"
              {...register('numeroMatricula')}
              error={errors.numeroMatricula?.message}
              placeholder="XX-XXXX-XXX"
              compact={true}
              disabled={disabled}
              onChange={(e) => {
                const formatted = formatMatricula(e.target.value);
                e.target.value = formatted;
                setValue('numeroMatricula', formatted);
              }}
            />
          </div>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={loading || disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`w-full px-2 py-1 bg-primary-600 text-white rounded-lg text-xs
                   ${!disabled ? 'hover:bg-primary-700' : 'opacity-50 cursor-not-allowed'}
                   flex items-center justify-center gap-1.5`}
      >
        {loading ? (
          <>
            <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Guardando...</span>
          </>
        ) : (
          'Completar Perfil'
        )}
      </motion.button>
    </form>
  );
}; 