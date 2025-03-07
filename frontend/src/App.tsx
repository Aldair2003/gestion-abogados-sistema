import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import './styles/datepicker.css';
import { CompleteProfile } from './pages/auth/CompleteProfile';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';

// Configuración de inactividad
const sessionConfig = {
  inactivityTimeout: 60 * 60 * 1000,    // 1 hora (60 minutos)
  warningTime: 20 * 60 * 1000,          // 20 minutos antes de la expiración
  exemptRoutes: ['/login', '/register', '/forgot-password']
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
                {/* Rutas públicas */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                
                {/* Rutas protegidas */}
                <Route element={<PrivateRoute />}>
                  <Route element={<MainLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="complete-profile" element={<CompleteProfile />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="expedientes/*" element={<Dashboard />} />
                    <Route path="calendario" element={<Dashboard />} />
                    
                    {/* Rutas de administración */}
                    <Route 
                      path="admin/usuarios" 
                      element={
                        <ProtectedRoute isAdmin>
                          <UsersList />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/settings" element={<SettingsPage />} />
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
