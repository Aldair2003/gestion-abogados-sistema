import React, { useState } from 'react';
import { LoginForm } from '../../components/auth/LoginForm';
import logo from '../../assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBookOpen, FiShield, FiAward, FiAlertCircle } from 'react-icons/fi';
import { IconType } from 'react-icons';

// Componente IconWrapper para manejar los iconos
interface IconWrapperProps {
  icon: IconType;
  className?: string;
  'aria-hidden'?: boolean | string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, ...props }) => {
  const Component = Icon as React.ElementType;
  return <Component {...props} />;
};

export const LoginPage = () => {
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  const handleAccountDisabled = () => {
    setIsAccountDisabled(true);
    setTimeout(() => {
      setIsAccountDisabled(false);
    }, 15000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Fondo decorativo mejorado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-[#1a237e]/30 to-[#283593]/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] bg-gradient-to-tr from-[#1a237e]/20 to-[#283593]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Notificación de cuenta desactivada */}
      <AnimatePresence mode="wait">
        {isAccountDisabled && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-4 right-4 z-50 w-full max-w-sm"
          >
            <div className="bg-red-50 border border-red-100 rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-3 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <IconWrapper
                    icon={FiAlertCircle}
                    className="h-5 w-5 text-red-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    Cuenta desactivada
                  </h3>
                  <p className="text-sm text-red-700 leading-relaxed">
                    Su cuenta ha sido desactivada. Por favor, contacte al administrador para reactivarla.
                  </p>
                </div>
              </div>
              {/* Barra de progreso */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 15, ease: "linear" }}
                className="h-1 bg-red-200"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor principal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[1000px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-[1.5rem] shadow-xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Panel izquierdo - Información */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-[55%] p-6 md:p-8 bg-gradient-to-br from-[#1a237e] to-[#283593] text-white relative overflow-hidden"
          >
            {/* Decoración de fondo mejorada */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 2px, transparent 0)`,
                  backgroundSize: '30px 30px'
                }}
              ></div>
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
            </div>

            {/* Contenido */}
            <div className="relative z-10">
              {/* Logo y título */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="flex items-center gap-6 mb-12"
              >
                <img 
                  src={logo} 
                  alt="M&V Abogados" 
                  className="w-24 h-24 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
                />
                <div>
                  <h1 className="text-3xl font-light tracking-wider">M&V ABOGADOS</h1>
                  <p className="text-white/70 tracking-widest text-sm">ESTUDIO JURÍDICO</p>
                </div>
              </motion.div>

              {/* Frase inspiradora */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-12 p-6 border-l-2 border-white/20"
              >
                <p className="text-xl font-light italic text-white/90">
                  "En la justicia encontramos la base de la paz social y el fundamento de una sociedad próspera."
                </p>
                <p className="text-sm text-white/60 mt-2">- Ulpiano</p>
              </motion.div>

              {/* Características */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-8 mb-12"
              >
                <div className="flex items-start gap-4">
                  <IconWrapper 
                    icon={FiBookOpen}
                    className="w-6 h-6 mt-1 text-white/80" 
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Excelencia Profesional</h3>
                    <p className="text-white/70 leading-relaxed">Más de 8 años de experiencia en asesoría jurídica integral.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <IconWrapper 
                    icon={FiShield}
                    className="w-6 h-6 mt-1 text-white/80" 
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Defensa Especializada</h3>
                    <p className="text-white/70 leading-relaxed">Protegemos sus derechos con dedicación y profesionalismo.</p>
                  </div>
                </div>
              </motion.div>

              {/* Footer actualizado */}
              <div className="flex justify-center items-center space-x-8 text-sm">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center space-y-2"
                >
                  <IconWrapper 
                    icon={FiBookOpen}
                    className="w-5 h-5 text-white/80" 
                    aria-hidden="true"
                  />
                  <span className="text-white/80 font-light tracking-wider">
                    Asesoría Legal
                  </span>
                </motion.div>
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-6"></span>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center space-y-2"
                >
                  <IconWrapper 
                    icon={FiShield}
                    className="w-5 h-5 text-white/80" 
                    aria-hidden="true"
                  />
                  <span className="text-white/80 font-light tracking-wider">
                    Defensa Jurídica
                  </span>
                </motion.div>
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-6"></span>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center space-y-2"
                >
                  <IconWrapper 
                    icon={FiAward}
                    className="w-5 h-5 text-white/80" 
                    aria-hidden="true"
                  />
                  <span className="text-white/80 font-light tracking-wider">
                    Consultoría Legal
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Panel derecho - Login */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-[45%] p-8 md:p-10 flex flex-col justify-center bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-[450px] mx-auto w-full"
            >
              <div className="text-center mb-10">
                <motion.h2 
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  className="text-4xl font-light text-gray-800 dark:text-gray-100 mb-4 tracking-tight"
                >
                  Bienvenido
                </motion.h2>
                <div className="relative">
                  <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent top-1/2 -translate-y-1/2"></div>
                  <p className="text-sm font-medium tracking-wide text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-1 rounded-full inline-block relative">
                    Portal Legal | Acceso Privado
                  </p>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/20 dark:to-purple-400/20 rounded-xl blur opacity-50"></div>
                <div className="relative">
                  <LoginForm onAccountDisabled={handleAccountDisabled} />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center"
              >
                <div className="inline-flex items-center justify-center px-4 py-2 space-x-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-100 dark:border-gray-700">
                  <span className="text-gray-400 dark:text-gray-500 text-xs">©</span>
                  <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">{new Date().getFullYear()}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">M&V Abogados</span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 tracking-wider uppercase">
                  Todos los derechos reservados
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}; 