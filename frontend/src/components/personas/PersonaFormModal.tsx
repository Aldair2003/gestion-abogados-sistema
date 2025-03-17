import React, { useEffect } from 'react';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { personaService, Persona } from '../../services/personaService';
import { Modal } from '../common/Modal';
import { TextField } from '../common/TextField';
import { 
  UserIcon, 
  DevicePhoneMobileIcon, 
  EnvelopeIcon, 
  HomeIcon, 
  TruckIcon, 
  UserGroupIcon,
  IdentificationIcon 
} from '../icons/CustomIcons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface PersonaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cantonId: string;
  onSuccess: () => void;
  persona?: Persona | null;
}

const formSchema = z.object({
  cedula: z.string()
    .min(1, 'La cédula es requerida')
    .min(10, 'La cédula debe tener 10 dígitos')
    .max(10, 'La cédula debe tener 10 dígitos')
    .regex(/^\d+$/, 'La cédula debe contener solo números'),
  nombres: z.string()
    .min(1, 'Los nombres son requeridos')
    .min(3, 'Los nombres deben tener al menos 3 caracteres'),
  apellidos: z.string()
    .min(1, 'Los apellidos son requeridos')
    .min(3, 'Los apellidos deben tener al menos 3 caracteres'),
  telefono: z.string()
    .min(1, 'El teléfono es requerido')
    .min(10, 'El teléfono debe tener 10 dígitos')
    .max(10, 'El teléfono debe tener 10 dígitos')
    .regex(/^\d+$/, 'El teléfono debe contener solo números'),
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  domicilio: z.string()
    .min(1, 'El domicilio es requerido')
    .min(5, 'El domicilio debe tener al menos 5 caracteres'),
  matriculasVehiculo: z.string()
    .optional()
    .transform(val => val || '')
    .refine(val => {
      if (!val) return true;
      const matriculas = val.split(',').map(m => m.trim()).filter(Boolean);
      return matriculas.every(m => /^[A-Z]{3}-\d{3,4}$/.test(m));
    }, 'Las matrículas deben tener el formato ABC-123 o ABC-1234'),
  contactoRef: z.string()
    .optional()
    .transform(val => val || '')
});

type FormData = z.infer<typeof formSchema>;

export const PersonaFormModal: React.FC<PersonaFormModalProps> = ({
  isOpen,
  onClose,
  cantonId,
  onSuccess,
  persona
}) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset,
    setError,
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cedula: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      email: '',
      domicilio: '',
      matriculasVehiculo: '',
      contactoRef: ''
    }
  });

  // Función para formatear matrículas
  const formatMatriculas = (value: string) => {
    if (!value) return '';
    
    return value.split(',').map(matricula => {
      // Eliminar espacios y guiones existentes
      const cleaned = matricula.trim().replace(/[-\s]/g, '').toUpperCase();
      
      if (cleaned.length >= 3) {
        // Insertar guión después de las primeras 3 letras
        return cleaned.slice(0, 3) + '-' + cleaned.slice(3);
      }
      return cleaned;
    }).join(', ');
  };

  // Observar cambios en el campo de matrículas solo cuando el usuario edita
  const matriculasValue = watch('matriculasVehiculo');
  useEffect(() => {
    // Solo formatear cuando el usuario está editando activamente
    // y no durante la carga inicial de datos
    if (matriculasValue && !isSubmitting) {
      const formatted = formatMatriculas(matriculasValue);
      if (formatted !== matriculasValue) {
        setValue('matriculasVehiculo', formatted, { shouldValidate: false });
      }
    }
  }, [matriculasValue, setValue, isSubmitting]);

  // Efecto para cargar datos iniciales - solo se ejecuta cuando cambia persona
  useEffect(() => {
    if (persona) {
      console.log('Cargando datos de persona para edición:', persona);
      
      // Usar reset en lugar de múltiples setValue para evitar renderizados múltiples
      reset({
        cedula: persona.cedula || '',
        nombres: persona.nombres || '',
        apellidos: persona.apellidos || '',
        telefono: persona.telefono || '',
        email: persona.email || '',
        domicilio: persona.domicilio || '',
        matriculasVehiculo: persona.matriculasVehiculo ? persona.matriculasVehiculo.join(', ') : '',
        contactoRef: persona.contactoRef || ''
      });
      
      // Si necesitamos formatear las matrículas, hacerlo después del reset
      if (persona.matriculasVehiculo && persona.matriculasVehiculo.length > 0) {
        const formattedMatriculas = formatMatriculas(persona.matriculasVehiculo.join(', '));
        setValue('matriculasVehiculo', formattedMatriculas, { shouldValidate: false });
      }
    }
  }, [persona, reset, setValue]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      console.log('Enviando datos del formulario:', data);
      
      const formattedValues = {
        ...data,
        matriculasVehiculo: data.matriculasVehiculo 
          ? data.matriculasVehiculo.split(',')
              .map(m => m.trim())
              .filter(Boolean)
              .map(m => m.toUpperCase())
          : []
      };

      console.log('Valores formateados para enviar:', formattedValues);

      if (persona) {
        // Actualizar persona existente
        await personaService.updatePersona(persona.id.toString(), formattedValues);
        toast.success('Persona actualizada exitosamente');
      } else {
        // Crear nueva persona
        await personaService.createPersona(cantonId, formattedValues);
        toast.success('Persona registrada exitosamente');
      }
      
      // Limpiar formulario y cerrar modal
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al procesar persona:', error);
      
      // Manejar errores específicos
      if (error.response?.status === 409) {
        setError('cedula', {
          type: 'manual',
          message: 'Ya existe una persona con esta cédula'
        });
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('matrícula')) {
        setError('matriculasVehiculo', {
          type: 'manual',
          message: 'Una o más matrículas tienen formato inválido (use el formato ABC-123 o ABC-1234)'
        });
      } else if (error.response?.data?.errors) {
        // Manejar errores de validación del backend
        Object.entries(error.response.data.errors).forEach(([field, message]) => {
          setError(field as keyof FormData, {
            type: 'manual',
            message: message as string
          });
        });
      } else {
        toast.error(error.message || `Error al ${persona ? 'actualizar' : 'crear'} la persona`);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={persona ? `Editar Persona: ${persona.nombres} ${persona.apellidos}` : "Registrar Nueva Persona"}
      size="xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Cédula"
            icon={<IdentificationIcon className="h-5 w-5" />}
            {...register('cedula')}
            error={errors.cedula?.message}
            required
            placeholder="Ingrese el número de cédula"
            helperText="Número de identificación (10 dígitos)"
          />

          <TextField
            label="Nombres"
            icon={<UserIcon className="h-5 w-5" />}
            {...register('nombres')}
            error={errors.nombres?.message}
            required
            placeholder="Ingrese los nombres"
            helperText="Nombres de la persona"
          />

          <TextField
            label="Apellidos"
            icon={<UserIcon className="h-5 w-5" />}
            {...register('apellidos')}
            error={errors.apellidos?.message}
            required
            placeholder="Ingrese los apellidos"
            helperText="Apellidos de la persona"
          />
          
          <TextField
            label="Teléfono"
            icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
            {...register('telefono')}
            error={errors.telefono?.message}
            required
            placeholder="Ej: 0912345678"
            helperText="Número de teléfono móvil (10 dígitos)"
          />

          <TextField
            label="Email"
            icon={<EnvelopeIcon className="h-5 w-5" />}
            {...register('email')}
            error={errors.email?.message}
            type="email"
            placeholder="ejemplo@correo.com"
            helperText="Correo electrónico de contacto (opcional)"
          />

          <TextField
            label="Domicilio"
            icon={<HomeIcon className="h-5 w-5" />}
            {...register('domicilio')}
            error={errors.domicilio?.message}
            required
            placeholder="Ingrese la dirección completa"
            helperText="Dirección de residencia actual"
          />

          <TextField
            label="Matrículas de Vehículo"
            icon={<TruckIcon className="h-5 w-5" />}
            {...register('matriculasVehiculo')}
            error={errors.matriculasVehiculo?.message}
            placeholder="Ej: ABC123, XYZ789"
            helperText="Ingrese las letras y números juntos, el guión se agregará automáticamente"
          />

          <TextField
            label="Contacto Referencia"
            icon={<UserGroupIcon className="h-5 w-5" />}
            {...register('contactoRef')}
            error={errors.contactoRef?.message}
            placeholder="Nombre y teléfono del contacto"
            helperText="Persona de contacto en caso de emergencia"
          />
                </div>

        <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
      </form>
    </Modal>
  );
};

export default PersonaFormModal; 