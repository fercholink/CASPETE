import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';
import CookieBanner from './components/CookieBanner';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <CookieBanner />
    </AuthProvider>
  );
}
