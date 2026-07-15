import { RouterProvider } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';

export default function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
          <h2>Algo salió mal</h2>
          <p>Ocurrió un error inesperado. Por favor recarga la página.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Recargar</button>
        </div>
      }
    >
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Sentry.ErrorBoundary>
  );
}
