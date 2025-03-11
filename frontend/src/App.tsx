import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { Dashboard } from './pages/dashboard/Dashboard';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { SessionManager } from './components/session/SessionManager';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { UsersList } from './pages/admin/users/UsersList';
import './styles/datepicker.css';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import CantonesPage from './pages/cantones/CantonesPage';
import PermissionsPage from './pages/admin/Permissions';
import PersonasPage from './pages/personas/PersonasPage';

// Configuración de inactividad
const sessionConfig = {
  inactivityTimeout: 60 * 60 * 1000,    // 1 hora
  warningTime: 20 * 60 * 1000,          // 20 minutos antes
  exemptRoutes: ['/login', '/register', '/forgot-password', '/reset-password']
};


//const sessionConfig = {
//  inactivityTimeout: 1 * 60 * 1000,    // 1 minuto
//  warningTime: 30 * 1000,              // 30 segundos antes
//  exemptRoutes: ['/login', '/register', '/forgot-password']
//};


export const App = () => {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <SessionManager config={sessionConfig}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                
                {/* Rutas protegidas */}
                <Route element={<PrivateRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="expedientes/*" element={<Dashboard />} />
                    <Route path="calendario" element={<Dashboard />} />
                    <Route path="cantones" element={<CantonesPage />} />
                    <Route path="cantones/:cantonId/personas" element={<PersonasPage />} />
                    
                    {/* Rutas de administración */}
                    <Route path="/admin">
                      <Route path="usuarios" element={<UsersList />} />
                      <Route path="permisos" element={<PermissionsPage />} />
                    </Route>
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>
                </Route>
              </Routes>
              <ToastContainer />
            </SessionManager>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
