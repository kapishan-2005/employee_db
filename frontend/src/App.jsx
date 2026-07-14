import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import AttendancePage from './pages/AttendancePage';
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
              path="/ceo/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ceo']}>
                  <MainLayout>
                    <CEODashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ceo/users"
              element={
                <ProtectedRoute allowedRoles={['ceo']}>
                  <MainLayout>
                    <CEOUsers />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/recruitment"
              element={
                <ProtectedRoute allowedRoles={['ceo', 'admin']}>
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