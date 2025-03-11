import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Document } from '../../services/personaService';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ArrowDownTrayIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-5 h-5"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" 
    />
  </svg>
);

interface DocumentPreviewProps {
  document: Document;
  onVerify: (documentId: string) => Promise<void>;
  onReject: (documentId: string, reason: string) => Promise<void>;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onVerify,
  onReject
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      await onVerify(document.id.toString());
      toast.success('Documento verificado exitosamente');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error al verificar el documento');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Debe proporcionar un motivo de rechazo');
      return;
    }

    try {
      setIsRejecting(true);
      await onReject(document.id.toString(), rejectReason);
      toast.success('Documento rechazado');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error al rechazar el documento');
      console.error(error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  const isImage = document.mimetype.startsWith('image/');
  const isPDF = document.mimetype === 'application/pdf';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <EyeIcon className="w-4 h-4" />
        Ver Documento
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Vista Previa del Documento
            </Dialog.Title>

            <div className="space-y-4">
              {/* Información del documento */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {document.filename}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {(document.size / 1024 / 1024).toFixed(2)} MB • {document.tipo}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
                >
                  <ArrowDownTrayIcon />
                  <span className="text-sm">Descarg</span>
                </button>
              </div>

              {/* Vista previa del documento */}
              <div className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-video">
                {isImage ? (
                  <img
                    src={document.url}
                    alt={document.filename}
                    className="w-full h-full object-contain"
                  />
                ) : isPDF ? (
                  <iframe
                    src={document.url}
                    title={document.filename}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                    <DocumentTextIcon className="w-16 h-16 mb-4" />
                    <p>Vista previa no disponible</p>
                    <p className="text-sm">Descarga el archivo para visualizarlo</p>
                  </div>
                )}
              </div>

              {/* Acciones de verificación */}
              <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                <div className="flex justify-between gap-4">
                  <button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    {isVerifying ? 'Verificando...' : 'Verificar Documento'}
                  </button>
                  <button
                    onClick={() => setIsRejecting(!isRejecting)}
                    className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    Rechazar Documento
                  </button>
                </div>

                {isRejecting && (
                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ingrese el motivo del rechazo..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsRejecting(false)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={!rejectReason.trim() || isRejecting}
                        className="px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {isRejecting ? 'Rechazando...' : 'Confirmar Rechazo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}; 