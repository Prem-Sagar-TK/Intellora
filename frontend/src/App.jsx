import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';

// Direct imports for public/entry pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy loaded pages for code splitting (dashboard routes)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Insights = lazy(() => import('./pages/Insights'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

// Modern Loading Spinner Fallback for Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
  </div>
);

function AppRoutes() {
  return (
    <div className="font-sans text-gray-900 bg-[#eef0f4] min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Suspense wrapper around all lazy-loaded dashboard pages */}
            <Route index element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="transactions" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Transactions />
              </Suspense>
            } />
            <Route path="insights" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Insights />
              </Suspense>
            } />
            <Route path="budgets" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Budgets />
              </Suspense>
            } />
            <Route path="reports" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Reports />
              </Suspense>
            } />
            <Route path="profile" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Profile />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Settings />
              </Suspense>
            } />
            <Route path="admin" element={
              <AdminRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <Admin />
                </Suspense>
              </AdminRoute>
            } />
          </Route>
        </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <Router>
            <AppRoutes />
          </Router>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
