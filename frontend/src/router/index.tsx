import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import AuthCallbackPage from '../pages/AuthCallbackPage';
import DashboardPage from '../pages/DashboardPage';
import SchoolsPage from '../pages/SchoolsPage';
import SchoolFormPage from '../pages/SchoolFormPage';
import StudentsPage from '../pages/StudentsPage';
import StudentFormPage from '../pages/StudentFormPage';
import ProductsPage from '../pages/ProductsPage';
import ProductFormPage from '../pages/ProductFormPage';
import OrdersPage from '../pages/OrdersPage';
import NewOrderPage from '../pages/NewOrderPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import StoresPage from '../pages/StoresPage';
import StoreFormPage from '../pages/StoreFormPage';
import TransactionsPage from '../pages/TransactionsPage';
import UsersPage from '../pages/UsersPage';
import ProfilePage from '../pages/ProfilePage';
import LandingPage from '../pages/LandingPage';
import TopupRequestsPage from '../pages/TopupRequestsPage';
import PaymentMethodsPage from '../pages/PaymentMethodsPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },

  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },

  // ── Colegios ──────────────────────────────────────────
  {
    path: '/schools',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <SchoolsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/schools/new',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <SchoolFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/schools/:id/edit',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <SchoolFormPage />
      </ProtectedRoute>
    ),
  },

  // ── Estudiantes ───────────────────────────────────────
  {
    path: '/students',
    element: (
      <ProtectedRoute allowedRoles={['PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <StudentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/students/new',
    element: (
      <ProtectedRoute allowedRoles={['PARENT']}>
        <StudentFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/students/:id/edit',
    element: (
      <ProtectedRoute allowedRoles={['PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <StudentFormPage />
      </ProtectedRoute>
    ),
  },

  // ── Productos ─────────────────────────────────────────
  {
    path: '/products',
    element: (
      <ProtectedRoute allowedRoles={['VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <ProductsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/products/new',
    element: (
      <ProtectedRoute allowedRoles={['VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <ProductFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/products/:id/edit',
    element: (
      <ProtectedRoute allowedRoles={['VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <ProductFormPage />
      </ProtectedRoute>
    ),
  },

  // ── Perfil ────────────────────────────────────────────
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },

  // ── Usuarios ──────────────────────────────────────────
  {
    path: '/users',
    element: (
      <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <UsersPage />
      </ProtectedRoute>
    ),
  },

  // ── Tiendas ───────────────────────────────────────────
  {
    path: '/stores',
    element: (
      <ProtectedRoute allowedRoles={['VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <StoresPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/stores/new',
    element: (
      <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <StoreFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/stores/:id/edit',
    element: (
      <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <StoreFormPage />
      </ProtectedRoute>
    ),
  },

  // ── Transacciones ─────────────────────────────────────
  {
    path: '/transactions',
    element: (
      <ProtectedRoute allowedRoles={['PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <TransactionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/topup-requests',
    element: (
      <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <TopupRequestsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/payment-methods',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <PaymentMethodsPage />
      </ProtectedRoute>
    ),
  },

  // ── Pedidos ───────────────────────────────────────────
  {
    path: '/orders',
    element: (
      <ProtectedRoute allowedRoles={['PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <OrdersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/orders/new',
    element: (
      <ProtectedRoute allowedRoles={['PARENT']}>
        <NewOrderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/orders/:id',
    element: (
      <ProtectedRoute allowedRoles={['PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <OrderDetailPage />
      </ProtectedRoute>
    ),
  },

  {
    path: '/no-autorizado',
    element: (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <span className="brand-badge">
            <span className="brand-dot" />
            CASPETE
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.44px' }}>
            Acceso restringido
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 15, margin: 0 }}>
            No tienes permiso para ver esta página.
          </p>
        </div>
      </div>
    ),
  },
]);
