import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export interface Document {
  id?: string;
  type: 'identity' | 'voting' | 'vehicle' | 'license' | 'tax' | 'address';
  file: File;
  status: 'pending' | 'uploaded' | 'verified';
  preview?: string;
}

interface DocumentUploaderProps {
  onUpload: (documents: Document[]) => Promise<void>;
  maxSize?: number; // en bytes
  acceptedTypes?: string[];
}

const DOCUMENT_TYPES = {
  identity: {
    label: 'Documento de Identidad',
    required: true,
  },
  voting: {
    label: 'Comprobante de Votación',
    required: true,
  },
  vehicle: {
    label: 'Documentos Vehiculares',
    required: true,
  },
  license: {
    label: 'Licencia de Conducir',
    required: false,
  },
  tax: {
    label: 'Documentación Tributaria',
    required: false,
  },
  address: {
    label: 'Comprobante de Domicilio',
    required: false,
  },
};

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onUpload,
  maxSize = 5 * 1024 * 1024, // 5MB por defecto
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newDocuments = acceptedFiles.map(file => ({
      file,
      type: 'identity' as Document['type'], // tipo por defecto
      status: 'pending' as Document['status'],
      preview: URL.createObjectURL(file),
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedTypes.filter(type => type.startsWith('.')).map(type => type.slice(1)),
      'application/pdf': ['.pdf'],
    },
    maxSize,
    multiple: true,
  });

  const handleUpload = async () => {
    const requiredTypes = Object.entries(DOCUMENT_TYPES)
      .filter(([_, config]) => config.required)
      .map(([type]) => type);

    const missingRequired = requiredTypes.filter(
      type => !documents.some(doc => doc.type === type)
    );

    if (missingRequired.length > 0) {
      toast.error(`Faltan documentos requeridos: ${missingRequired.map(type => DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES].label).join(', ')}`);
      return;
    }

    try {
      setUploading(true);
      await onUpload(documents);
      toast.success('Documentos subidos exitosamente');
      setDocuments([]);
    } catch (error) {
      toast.error('Error al subir los documentos');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleTypeChange = (documentId: string, newType: Document['type']) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.preview === documentId ? { ...doc, type: newType } : doc
      )
    );
  };

  const handleRemove = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.preview !== documentId));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500'
          }`}
      >
        <input {...getInputProps()} />
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isDragActive
            ? 'Suelta los archivos aquí...'
            : 'Arrastra y suelta archivos aquí, o haz clic para seleccionar'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Formatos permitidos: {acceptedTypes.join(', ')} (Máx. {Math.round(maxSize / 1024 / 1024)}MB)
        </p>
      </div>

      {documents.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Documentos ({documents.length})
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.preview}
                className="relative group rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <select
                      value={doc.type}
                      onChange={(e) => handleTypeChange(doc.preview!, e.target.value as Document['type'])}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      {Object.entries(DOCUMENT_TYPES).map(([type, config]) => (
                        <option key={type} value={type}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {doc.file.name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(doc.preview!)}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <span className="sr-only">Eliminar</span>
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  </button>
                </div>
                {doc.status === 'verified' && (
                  <CheckCircleIcon className="absolute top-2 right-2 h-5 w-5 text-green-500" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading || documents.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Subir Documentos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 