import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { User, UserRole } from '../../../types/user';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { TextField } from '../../../components/common/TextField';
import { SelectField } from '../../../components/common/SelectField';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => void;
  initialData?: User;
  title: string;
}

// Definir los tipos para los valores del formulario
interface FormValues {
  email: string;
  rol: UserRole;
  nombre?: string;
  cedula?: string;
  telefono?: string;
}

const createSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email inválido')
    .required('El email es requerido'),
  rol: Yup.string()
    .oneOf(Object.values(UserRole), 'Rol inválido')
    .required('El rol es requerido')
});

const editSchema = Yup.object().shape({
  nombre: Yup.string().required('El nombre es requerido'),
  email: Yup.string()
    .email('Email inválido')
    .required('El email es requerido'),
  cedula: Yup.string()
    .matches(/^[0-9]{10}$/, 'La cédula debe tener 10 dígitos')
    .required('La cédula es requerida'),
  telefono: Yup.string().required('El teléfono es requerido'),
  rol: Yup.string()
    .oneOf(Object.values(UserRole), 'Rol inválido')
    .required('El rol es requerido')
});

export const UserFormModal = ({ isOpen, onClose, onSubmit, initialData, title }: UserFormModalProps) => {
  const isEditing = !!initialData;
  
  const initialValues: FormValues = isEditing ? {
    nombre: initialData.nombre || '',
    email: initialData.email || '',
    cedula: initialData.cedula || '',
    telefono: initialData.telefono || '',
    rol: initialData.rol
  } : {
    email: '',
    rol: UserRole.COLABORADOR
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <Formik<FormValues>
        initialValues={initialValues}
        validationSchema={isEditing ? editSchema : createSchema}
        onSubmit={onSubmit}
      >
        {() => (
          <Form className="space-y-4">
            {isEditing ? (
              <>
                <TextField name="nombre" label="Nombre" />
                <TextField name="email" label="Email" />
                <TextField name="cedula" label="Cédula" />
                <TextField name="telefono" label="Teléfono" />
              </>
            ) : (
              <TextField name="email" label="Email" />
            )}
            
            <SelectField name="rol" label="Rol">
              <option value="">Seleccione un rol</option>
              <option value={UserRole.ADMIN}>Administrador</option>
              <option value={UserRole.COLABORADOR}>Colaborador</option>
            </SelectField>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}; 