import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ArrowDownTrayIcon from '../icons/ArrowDownTrayIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { personaService, Document, Persona } from '../../services/personaService';
import { toast } from 'react-hot-toast';
import { Modal } from '../common/Modal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  HomeIcon,
  DocumentIcon,
  ArrowUpTrayIcon
} from '../icons/CustomIcons';

interface DocumentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona;
  onSuccess?: () => void;
}

const DocumentosModal: React.FC<DocumentosModalProps> = ({
  isOpen,
  onClose,
  persona,
  onSuccess
}) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'docs'>('info');
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const isAdmin = user?.rol === 'ADMIN';
  const isCreador = persona.creadorId?.toString() === user?.id?.toString();
  const canUploadDocs = isAdmin || isCreador;

  const loadDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await personaService.getDocumentos(persona.id.toString());
      setDocumentos(docs);
    } catch (error: any) {
      toast.error('Error al cargar los documentos');
      console.error('Error cargando documentos:', error);
    } finally {
      setLoading(false);
    }
  }, [persona.id]);

  useEffect(() => {
    if (isOpen) {
      loadDocumentos();
    }
  }, [isOpen, loadDocumentos]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    try {
      setUploading(true);
      await personaService.uploadDocuments(persona.id.toString(), [file], tipo);
      toast.success('Documento subido correctamente');
      await loadDocumentos(); // Recargamos los documentos
      if (onSuccess) {
        onSuccess(); // Notificamos al componente padre para que actualice la lista de personas
      }
      // Limpiar el input file
      e.target.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    console.log('=== Iniciando proceso de eliminación ===');
    console.log('Documento a eliminar:', document);
    console.log('Usuario actual:', user);
    console.log('¿Es admin?:', isAdmin);

    if (!isAdmin) {
      toast.error('Solo los administradores pueden eliminar documentos');
      return;
    }

    if (!document.id) {
      console.error('El documento no tiene ID');
      toast.error('Error: El documento no tiene identificador');
      return;
    }

    // Verificar que el documento tenga un ID válido
    if (isNaN(Number(document.id))) {
      console.error('ID de documento inválido:', document.id);
      toast.error('Error: ID de documento inválido');
      return;
    }

    setDocumentToDelete(document);
    setShowDeleteConfirm(true);
  };

  const handleModalClose = () => {
    if (!showDeleteConfirm) {  // Solo cerrar si no hay modal de confirmación abierto
      console.log('=== Cerrando modal principal ===');
      onClose();
    }
  };

  const handleDeleteConfirmClose = () => {
    console.log('=== Cerrando modal de confirmación ===');
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleDeleteConfirm = () => {
    console.log('=== Confirmando eliminación desde modal ===');
    confirmDelete();
  };

  const confirmDelete = async () => {
    if (!documentToDelete) {
      console.error('No hay documento seleccionado para eliminar');
      return;
    }

    try {
      console.log('=== Iniciando confirmación de eliminación ===');
      const docId = documentToDelete.id.toString();
      const persId = persona.id.toString();
      
      await personaService.deleteDocument(docId, persId);
      toast.success('Documento eliminado exitosamente');
      
      // Primero actualizamos los documentos localmente
      await loadDocumentos();
      
      // Luego cerramos el modal de confirmación
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
      
      // Notificamos el cambio sin cerrar el modal principal
      if (onSuccess) {
        onSuccess(); // Notificamos al componente padre para que actualice la lista de personas
      }
    } catch (error: any) {
      console.error('Error al eliminar documento:', error);
      toast.error(error.message || 'Error al eliminar el documento');
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const handlePreviewDocument = (document: Document) => {
    try {
      console.log('=== Iniciando previsualización de documento ===');
      console.log('Documento seleccionado:', document);
      
      let url = document.url;
      
      // Si es una URL de Cloudinary
      if (url.includes('cloudinary.com')) {
        // Remover cualquier parámetro existente
        url = url.split('?')[0];
        
        // Agregar parámetros para visualización segura
        const params = new URLSearchParams({
          secure: 'true',
          _: Date.now().toString(), // Prevenir cache
        });

        url = `${url}?${params.toString()}`;
      } else {
        // Para URLs locales
        const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';
        const documentPath = document.url.replace(/\\/g, '/');
        url = document.url.startsWith('http') ? document.url : `${baseUrl}/${documentPath}`;
      }
      
      console.log('URL construida para preview:', url);
      
      setPreviewUrl(url);
      setSelectedDocument(document);
    } catch (error) {
      console.error('Error al abrir la previsualización:', error);
      toast.error('Error al abrir la previsualización del documento');
    }
  };

  const handleClosePreview = () => {
    console.log('=== Cerrando previsualización ===');
    setSelectedDocument(null);
    setPreviewUrl(null);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedDocument || !previewUrl) {
      console.log('No hay documento seleccionado o URL de previsualización');
      return;
    }

    try {
      console.log('=== Iniciando descarga de documento ===');
      console.log('Documento a descargar:', selectedDocument);
      console.log('URL de descarga:', previewUrl);

      // Realizar la petición fetch para obtener el blob
      const response = await fetch(previewUrl);
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status} ${response.statusText}`);
      }

      // Convertir la respuesta a blob
      const blob = await response.blob();
      
      // Crear URL del blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear enlace temporal
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = selectedDocument.filename || `${getDocumentTypeLabel(selectedDocument.tipo)}.pdf`;
      
      // Agregar el enlace al documento
      document.body.appendChild(link);
      
      // Simular clic y limpiar
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('Descarga completada exitosamente');
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error detallado al descargar el documento:', error);
      toast.error('Error al descargar el documento. Por favor, inténtelo de nuevo.');
    }
  };

  const getDocumentoStatus = (tipo: string) => {
    const documento = documentos.find(d => d.tipo === tipo && d.isActive);
    const isObligatorio = ['CEDULA', 'CERTIFICADO_VOTACION', 'MATRICULA_VEHICULO'].includes(tipo);
    
    let label = 'No subido';
    let colorClass = isDarkMode 
      ? 'text-red-300 bg-red-900/50' 
      : 'text-red-600 bg-red-50';

    if (documento) {
      label = 'Subido';
      colorClass = isDarkMode 
        ? 'text-green-300 bg-green-900/50' 
        : 'text-green-600 bg-green-50';
    }

    return {
      documento,
      label,
      colorClass,
      isObligatorio
    };
  };

  const getDocumentTypeLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'CEDULA': 'Cédula',
      'VOTACION': 'Certificado de Votación',
      'MATRICULA': 'Matrícula de Vehículo',
      'LICENCIA': 'Licencia',
      'RUC': 'RUC',
      'RESIDENCIA': 'Certificado de Residencia'
    };
    return tipos[tipo] || tipo;
  };

  const renderDocumentActions = (tipo: string) => {
    const { documento } = getDocumentoStatus(tipo);
    
    if (documento) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => documento && handlePreviewDocument(documento)}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDarkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            <DocumentIcon className="h-4 w-4 mr-2" />
            Ver
          </button>

          {canUploadDocs && (
            <>
              <input
                type="file"
                id={`file-${tipo}`}
                className="hidden"
                accept=".pdf,application/pdf"
                onChange={(e) => handleFileUpload(e, tipo)}
                disabled={uploading}
              />
              <label
                htmlFor={`file-${tipo}`}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isDarkMode
                    ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                {uploading ? 'Subiendo...' : 'Cambiar'}
              </label>

              {isAdmin && documento && (
                <button
                  onClick={() => documento && handleDeleteDocument(documento)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      );
    }

    return canUploadDocs && (
      <div>
        <input
          type="file"
          id={`file-${tipo}`}
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={(e) => handleFileUpload(e, tipo)}
          disabled={uploading}
        />
        <label
          htmlFor={`file-${tipo}`}
          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            isDarkMode
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          {uploading ? 'Subiendo...' : 'Subir'}
        </label>
      </div>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        size="2xl"
        preventClose={true}
      >
        <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700/50 -mx-6 -mt-4 px-6 pb-6 pt-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {persona.nombres} {persona.apellidos}
            </h2>
            <button
              onClick={handleModalClose}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700/50 -mx-6 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'info'
                  ? isDarkMode
                    ? 'text-white border-b-2 border-primary-400 bg-[#1a2234]'
                    : 'text-gray-900 border-b-2 border-primary-600 bg-white'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-[#1a2234]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Información Personal
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'docs'
                  ? isDarkMode
                    ? 'text-white border-b-2 border-primary-400 bg-[#1a2234]'
                    : 'text-gray-900 border-b-2 border-primary-600 bg-white'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-[#1a2234]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Documentos
            </button>
          </div>

          {/* Content */}
          <div className="-mx-6 px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className={`animate-spin rounded-full h-8 w-8 border-2 ${
                  isDarkMode 
                    ? 'border-primary-500 border-t-transparent' 
                    : 'border-primary-600 border-t-transparent'
                }`} />
              </div>
            ) : activeTab === 'info' ? (
              <div className="space-y-6">
                {/* Información básica */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Información Básica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`flex items-center px-4 py-3 rounded-xl ${
                      isDarkMode 
                        ? 'bg-[#1a2234] text-white' 
                        : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    }`}>
                      <DocumentIcon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Cédula</div>
                        <div className="text-sm font-semibold">{persona.cedula}</div>
                      </div>
                    </div>
                    <div className={`flex items-center px-4 py-3 rounded-xl ${
                      isDarkMode 
                        ? 'bg-[#1a2234] text-white' 
                        : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    }`}>
                      <PhoneIcon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Teléfono</div>
                        <div className="text-sm font-semibold">{persona.telefono}</div>
                      </div>
                    </div>
                    {persona.email && (
                      <div className={`flex items-center px-4 py-3 rounded-xl ${
                        isDarkMode 
                          ? 'bg-[#1a2234] text-white' 
                          : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      }`}>
                        <EnvelopeIcon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</div>
                          <div className="text-sm font-semibold">{persona.email}</div>
                        </div>
                      </div>
                    )}
                    {persona.domicilio && (
                      <div className={`flex items-center px-4 py-3 rounded-xl ${
                        isDarkMode 
                          ? 'bg-[#1a2234] text-white' 
                          : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      }`}>
                        <HomeIcon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Domicilio</div>
                          <div className="text-sm font-semibold">{persona.domicilio}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información adicional */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Información Adicional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`px-4 py-3 rounded-xl ${
                      isDarkMode 
                        ? 'bg-[#1a2234] text-white' 
                        : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    }`}>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Matrículas de Vehículo</div>
                      <div className="text-sm font-semibold mt-1">
                        {persona.matriculasVehiculo?.join(', ') || 'No registradas'}
                      </div>
                    </div>
                    <div className={`px-4 py-3 rounded-xl ${
                      isDarkMode 
                        ? 'bg-[#1a2234] text-white' 
                        : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    }`}>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Contacto de Referencia</div>
                      <div className="text-sm font-semibold mt-1">
                        {persona.contactoRef || 'No registrado'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Documentos obligatorios */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Documentos Obligatorios
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {['CEDULA', 'CERTIFICADO_VOTACION', 'MATRICULA_VEHICULO'].map((doc) => {
                      const docStatus = getDocumentoStatus(doc);
                      return (
                        <div 
                          key={doc}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                            isDarkMode 
                              ? 'bg-[#1a2234] text-white' 
                              : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center min-w-0">
                            <DocumentIcon className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {getDocumentTypeLabel(doc)}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`px-2 py-0.5 rounded-full ${docStatus.colorClass}`}>
                                  {docStatus.label}
                                </span>
                                {docStatus.documento && (
                                  <span className="truncate max-w-[150px] text-gray-500 dark:text-gray-400">
                                    • {docStatus.documento.filename}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {docStatus.documento ? (
                              <>
                                <button
                                  onClick={() => docStatus.documento && handlePreviewDocument(docStatus.documento)}
                                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isDarkMode
                                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                  }`}
                                >
                                  <DocumentIcon className="h-4 w-4 mr-2" />
                                  Ver
                                </button>

                                {canUploadDocs && (
                                  <>
                                    <input
                                      type="file"
                                      id={`file-${doc}`}
                                      className="hidden"
                                      accept=".pdf"
                                      onChange={(e) => handleFileUpload(e, doc)}
                                      disabled={uploading}
                                    />
                                    <label
                                      htmlFor={`file-${doc}`}
                                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                                        isDarkMode
                                          ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                      }`}
                                    >
                                      <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                                      {uploading ? 'Subiendo...' : 'Cambiar'}
                                    </label>

                                    {isAdmin && docStatus.documento && (
                                      <button
                                        onClick={() => docStatus.documento && handleDeleteDocument(docStatus.documento)}
                                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                          isDarkMode
                                            ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </>
                            ) : (
                              canUploadDocs && (
                                <>
                                  <input
                                    type="file"
                                    id={`file-${doc}`}
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={(e) => handleFileUpload(e, doc)}
                                    disabled={uploading}
                                  />
                                  <label
                                    htmlFor={`file-${doc}`}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                                      isDarkMode
                                        ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    }`}
                                  >
                                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                                    {uploading ? 'Subiendo...' : 'Subir'}
                                  </label>
                                </>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Documentos opcionales */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Documentos Opcionales
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {['LICENCIA', 'RUC', 'CERTIFICADO_RESIDENCIA'].map((doc) => {
                      const docStatus = getDocumentoStatus(doc);
                      return (
                        <div 
                          key={doc}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                            isDarkMode 
                              ? 'bg-[#1a2234] text-white' 
                              : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center min-w-0">
                            <DocumentIcon className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {doc === 'LICENCIA' && 'Licencia de Conducir'}
                                {doc === 'RUC' && 'RUC'}
                                {doc === 'CERTIFICADO_RESIDENCIA' && 'Certificado de Residencia'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>{docStatus.label}</span>
                                {docStatus.documento && (
                                  <span className="truncate max-w-[150px]">
                                    • {docStatus.documento.filename}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            {renderDocumentActions(doc)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Previsualización */}
      {selectedDocument && previewUrl && (
        <Modal
          isOpen={true}
          onClose={handleClosePreview}
          size="xl"
          preventClose={false}
        >
          <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700/50 -mx-6 -mt-4 px-6 pb-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDocument && getDocumentTypeLabel(selectedDocument.tipo)}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Descargar
                </button>
                <button
                  onClick={handleClosePreview}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkMode
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-grow -mx-6 px-6 py-4" onClick={(e) => e.stopPropagation()}>
              <div 
                className={`rounded-xl overflow-hidden border h-full ${
                  isDarkMode ? 'border-gray-700/50' : 'border-gray-200'
                }`}
              >
                {selectedDocument?.url.includes('cloudinary.com') ? (
                  // Para documentos de Cloudinary
                  <iframe
                    src={previewUrl}
                    className="w-full h-[calc(100vh-300px)] min-h-[500px] pdf-viewer"
                    title={selectedDocument ? getDocumentTypeLabel(selectedDocument.tipo) : 'Vista previa'}
                    style={{ 
                      border: 'none',
                      pointerEvents: 'auto',
                    }}
                    allow="fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                  />
                ) : (
                  // Para documentos locales
                  <iframe
                    src={`${previewUrl}#toolbar=1&download=0&print=0`}
                    className="w-full h-[calc(100vh-300px)] min-h-[500px] pdf-viewer"
                    title={selectedDocument ? getDocumentTypeLabel(selectedDocument.tipo) : 'Vista previa'}
                    style={{ 
                      border: 'none',
                      pointerEvents: 'auto',
                    }}
                  />
                )}
                <style>
                  {`
                    /* Deshabilitar completamente el botón de descarga */
                    cr-icon-button#download,
                    cr-icon-button[iron-icon="cr:file-download"],
                    cr-icon-button[title="Descargar"],
                    cr-icon-button[aria-label="Descargar"],
                    #download,
                    #download-button,
                    #secondaryDownload,
                    .downloadButton,
                    button[data-l10n-id="download"],
                    #download-button-link,
                    [title*="download" i],
                    [aria-label*="download" i],
                    [title*="descargar" i],
                    [aria-label*="descargar" i],
                    .download,
                    cr-icon-button[title*="Download"],
                    cr-icon-button[title*="download"],
                    cr-icon-button[aria-label*="Download"],
                    cr-icon-button[aria-label*="download"] {
                      display: none !important;
                      visibility: hidden !important;
                      opacity: 0 !important;
                      pointer-events: none !important;
                      position: absolute !important;
                      width: 0 !important;
                      height: 0 !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      border: 0 !important;
                      clip: rect(0 0 0 0) !important;
                      transform: scale(0) !important;
                    }

                    /* Deshabilitar eventos de clic en el botón de descarga */
                    cr-icon-button#download *,
                    #download *,
                    .downloadButton * {
                      pointer-events: none !important;
                      cursor: default !important;
                    }

                    /* Mantener visible el resto de la barra de herramientas */
                    #toolbar,
                    #toolbarContainer,
                    .toolbar,
                    .toolbarContainer {
                      display: flex !important;
                      visibility: visible !important;
                      opacity: 1 !important;
                    }

                    /* Asegurarse que el contenido del PDF ocupe todo el espacio */
                    #viewerContainer,
                    #viewer,
                    .pdfViewer {
                      height: 100% !important;
                      width: 100% !important;
                    }

                    /* Deshabilitar el menú contextual del PDF */
                    #viewerContextMenu,
                    .contextMenu {
                      display: none !important;
                    }
                  `}
                </style>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Confirmación */}
      {showDeleteConfirm && (
        <ConfirmationModal
          isOpen={true}
          onClose={handleDeleteConfirmClose}
          onConfirm={handleDeleteConfirm}
          title="Confirmar eliminación"
          message={
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-500/20">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-center">
                ¿Está seguro que desea eliminar este documento?<br/>
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Esta acción no se puede deshacer.
                </span>
              </p>
            </div>
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          preventClose={false}
        />
      )}
    </>
  );
};

export default DocumentosModal; 