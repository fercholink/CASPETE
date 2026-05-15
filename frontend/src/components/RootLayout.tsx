import { Outlet } from 'react-router-dom';
import CookieBanner from '../components/CookieBanner';

/**
 * RootLayout: envuelve todas las rutas del router.
 * Coloca el CookieBanner aquí para que sea un componente
 * estable que NO se re-monta al cambiar de página.
 */
export default function RootLayout() {
  return (
    <>
      <Outlet />
      <CookieBanner />
    </>
  );
}
