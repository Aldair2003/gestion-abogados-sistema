import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Modal } from '../common/Modal';
import { TextField } from '../common/TextField';
import { SelectField } from '../common/SelectField';
import { UserRole, UserCreateData, UserUpdateData } from '../../types/user';
import { EnvelopeIcon } from '../icons/CustomIcons';

// Schema para validación de edición
const editUserSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  cedula: z.string().min(1, 'La cédula es requerida'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  rol: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Por favor seleccione un rol' })
  })
});

// Schema para creación (solo email y rol)
const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  rol: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Por favor seleccione un rol' })
  })
});

type FormValues = {
  create: z.infer<typeof createUserSchema>;
  edit: z.infer<typeof editUserSchema>;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserCreateData | UserUpdateData) => void;
  initialData?: UserUpdateData;
  title: string;
  mode: 'create' | 'edit';
  loading?: boolean;
}

export function UserFormModal({ isOpen, onClose, onSubmit, mode = 'create', initialData, title, loading = false }: UserFormModalProps) {
  type CurrentFormValues = FormValues[typeof mode];
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<CurrentFormValues>({
    resolver: zodResolver(mode === 'edit' ? editUserSchema : createUserSchema),
    defaultValues: mode === 'edit' ? {
      nombre: initialData?.nombre || '',
      email: initialData?.email || '',
      cedula: initialData?.cedula || '',
      telefono: initialData?.telefono || '',
      rol: initialData?.rol
    } : {
      email: '',
      rol: undefined
    }
  });

  // Actualizar el formulario cuando cambien los datos iniciales
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setValue('nombre' as keyof CurrentFormValues, initialData.nombre);
      setValue('email', initialData.email);
      setValue('cedula' as keyof CurrentFormValues, initialData.cedula);
      setValue('telefono' as keyof CurrentFormValues, initialData.telefono);
      setValue('rol', initialData.rol);
    }
  }, [initialData, mode, setValue]);

  const onSubmitHandler = (data: CurrentFormValues) => {
    onSubmit(data);
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6">
          <TextField
            label="Correo Electrónico"
            {...register('email')}
            error={errors.email?.message}
            placeholder="ejemplo@dominio.com"
            type="email"
            defaultValue={initialData?.email}
            icon={<EnvelopeIcon className="w-5 h-5" />}
            className="bg-gray-50 dark:bg-gray-800"
          />
          <SelectField
            label="Rol del Usuario"
            {...register('rol')}
            error={errors.rol?.message}
            defaultValue={initialData?.rol || undefined}
            className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            <option value="">Seleccione un rol</option>
            <option value={UserRole.ADMIN}>Administrador</option>
            <option value={UserRole.COLABORADOR}>Colaborador</option>
          </SelectField>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2.5 text-sm font-medium rounded-xl
                     text-gray-700 dark:text-gray-200
                     bg-white dark:bg-gray-800
                     hover:bg-gray-50 dark:hover:bg-gray-700
                     border border-gray-300 dark:border-gray-600
                     transition-all duration-200"
          >
            Cancelar
          </motion.button>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2.5 text-sm font-medium rounded-xl
                     text-white bg-primary-500 hover:bg-primary-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200
                     flex items-center gap-2
                     shadow-sm shadow-primary-500/20"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{mode === 'edit' ? 'Actualizar Usuario' : 'Crear Usuario'}</span>
            )}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
} 