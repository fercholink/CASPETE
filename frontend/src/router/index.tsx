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
import StoreProductsPage from '../pages/StoreProductsPage';
import TransactionsPage from '../pages/TransactionsPage';
import UsersPage from '../pages/UsersPage';
import ProfilePage from '../pages/ProfilePage';
import LandingPage from '../pages/LandingPage';
import TopupRequestsPage from '../pages/TopupRequestsPage';
import PaymentMethodsPage from '../pages/PaymentMethodsPage';
import Ley2120DashboardPage from '../pages/Ley2120DashboardPage';
import SuppliersPage from '../pages/SuppliersPage';
import SupplierFormPage from '../pages/SupplierFormPage';
import MisDatosPage from '../pages/MisDatosPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import PrivacyCompliancePage from '../pages/PrivacyCompliancePage';
import ChatPage from '../pages/ChatPage';
import SchoolLeadsPage from '../pages/SchoolLeadsPage';
import RootLayout from '../components/RootLayout';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  // ── Páginas legales públicas (accesibles sin login) ──────────────
  { path: '/privacidad', element: <PrivacyPolicyPage /> },
  { path: '/derechos-datos', element: <PrivacyPolicyPage /> },
  { path: '/cookies', element: <PrivacyPolicyPage /> },

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
  {
    path: '/stores/:id/products',
    element: (
      <ProtectedRoute allowedRoles={['VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <StoreProductsPage />
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

  // ── Ley 2120 Dashboard ──────────────────────────────
  {
    path: '/ley2120',
    element: (
      <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <Ley2120DashboardPage />
      </ProtectedRoute>
    ),
  },

  // ── Proveedores (Brecha #6) ────────────────────────────
  {
    path: '/suppliers',
    element: (
      <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <SuppliersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/suppliers/new',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <SupplierFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/suppliers/:id/edit',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <SupplierFormPage />
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

  // ── Derechos ARCO — Ley 1581/2012 ────────────────────────────────
  {
    path: '/mis-datos',
    element: (
      <ProtectedRoute>
        <MisDatosPage />
      </ProtectedRoute>
    ),
  },

  // ── Panel Compliance — SUPER_ADMIN ────────────────────────────────
  {
    path: '/privacy-compliance',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <PrivacyCompliancePage />
      </ProtectedRoute>
    ),
  },

  // ── Chat Interno Tendero ↔ Padre ──────────────────────────────────
  {
    path: '/chat',
    element: (
      <ProtectedRoute allowedRoles={['VENDOR', 'PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <ChatPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/chat/:threadId',
    element: (
      <ProtectedRoute allowedRoles={['VENDOR', 'PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
        <ChatPage />
      </ProtectedRoute>
    ),
  },

  // ── Colegios Interesados ── SUPER_ADMIN ─────────────────────────────
  {
    path: '/school-leads',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <SchoolLeadsPage />
      </ProtectedRoute>
    ),
  },
  ],  // end children of RootLayout
  },  // end RootLayout route
]);
