import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SetupGuard from './components/auth/SetupGuard';
import ErrorBoundary from './components/common/ErrorBoundary';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CompanySetupWizard from './pages/CompanySetupWizard';
import CompanySettingsPage from './pages/CompanySettingsPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPageLegacy';
import DepartmentsPage from './pages/DepartmentsPage';
import AttendancePage from './pages/AttendancePage';
import LeavePage from './pages/LeavePage';
import CEODashboard from './pages/CEO/Dashboard';
import CEOUsers from './pages/CEO/Users';
import RecruitmentPage from './pages/RecruitmentPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Company Setup Wizard (CEO only, shows once) */}
            <Route
              path="/setup"
              element={
                <ProtectedRoute allowedRoles={['ceo', 'CEO']}>
                  <SetupGuard requireSetup={true}>
                    <CompanySetupWizard />
                  </SetupGuard>
                </ProtectedRoute>
              }
            />

            {/* Company Settings (CEO/HR) */}
            <Route
              path="/settings/company"
              element={
                <ProtectedRoute allowedRoles={['ceo', 'CEO', 'hr', 'HR']}>
                  <MainLayout>
                    <CompanySettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Role-specific dashboard redirects to generic dashboard */}
            <Route
              path="/employee/dashboard"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/hr/dashboard"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/manager/dashboard"
              element={<Navigate to="/dashboard" replace />}
            />
            
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <EmployeesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DepartmentsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AttendancePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/leave"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LeavePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ceo/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ceo', 'CEO']}>
                  <SetupGuard requireCompleted={true}>
                    <MainLayout>
                      <CEODashboard />
                    </MainLayout>
                  </SetupGuard>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ceo/users"
              element={
                <ProtectedRoute allowedRoles={['ceo', 'CEO']}>
                  <SetupGuard requireCompleted={true}>
                    <MainLayout>
                      <CEOUsers />
                    </MainLayout>
                  </SetupGuard>
                </ProtectedRoute>
              }
            />

            <Route
              path="/recruitment"
              element={
                <ProtectedRoute allowedRoles={['ceo', 'CEO', 'hr', 'HR']}>
                  <MainLayout>
                    <RecruitmentPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}