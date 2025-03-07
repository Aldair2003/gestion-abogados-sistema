import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Modal } from '../common/Modal';
import { TextField } from '../common/TextField';
import { SelectField } from '../common/SelectField';

interface InitialProfileModalProps {
  isOpen: boolean;
  onComplete: (data: ProfileFormValues) => Promise<void>;
  onClose: () => void;
  initialData?: Partial<ProfileFormValues>;  // Hacemos opcional los datos iniciales
}

interface ProfileFormValues {
  nombre: string;
  cedula: string;
  telefono: string;
  domicilio: string;
  nivelEstudios: string;
  universidad?: string;
}

const validationSchema = Yup.object().shape({
  nombre: Yup.string().required('El nombre es requerido'),
  cedula: Yup.string().required('La cédula es requerida'),
  telefono: Yup.string().required('El teléfono es requerido'),
  domicilio: Yup.string().required('El domicilio es requerido'),
  nivelEstudios: Yup.string().required('El nivel de estudios es requerido'),
  universidad: Yup.string().when('nivelEstudios', {
    is: (val: string) => val === 'estudiante',
    then: (schema) => schema.required('La universidad es requerida'),
    otherwise: (schema) => schema.optional()
  })
});

export const InitialProfileModal: React.FC<InitialProfileModalProps> = ({
  isOpen,
  onComplete,
  onClose,
  initialData
}) => {
  const initialValues: ProfileFormValues = {
    nombre: initialData?.nombre || '',
    cedula: initialData?.cedula || '',
    telefono: initialData?.telefono || '',
    domicilio: initialData?.domicilio || '',
    nivelEstudios: initialData?.nivelEstudios || '',
    universidad: initialData?.universidad || ''
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Completa tu Perfil"
    >
      <div className="p-6">
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Por favor, completa tu información para continuar
        </p>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await onComplete(values);
            } catch (error) {
              console.error('Error al completar perfil:', error);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-4">
              <TextField name="nombre" label="Nombre Completo" />
              <TextField name="cedula" label="Cédula" />
              <TextField name="telefono" label="Teléfono" />
              <TextField name="domicilio" label="Domicilio" />
              
              <SelectField name="nivelEstudios" label="Nivel de Estudios">
                <option value="">Seleccione...</option>
                <option value="estudiante">Estudiante</option>
                <option value="graduado">Graduado</option>
                <option value="maestria">Maestría</option>
              </SelectField>

              {values.nivelEstudios === 'estudiante' && (
                <TextField name="universidad" label="Universidad" />
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                           border border-gray-300 rounded-md hover:bg-gray-200 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 
                           focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 
                           border border-transparent rounded-md hover:bg-primary-700 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 
                           focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
}; 