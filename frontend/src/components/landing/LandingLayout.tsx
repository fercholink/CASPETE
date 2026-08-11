import { Outlet } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';
import { LeadModalProvider } from './LeadModalProvider';
import { GpsOrderModalProvider } from './GpsOrderModalProvider';

export default function LandingLayout() {
  return (
    <LeadModalProvider>
      <GpsOrderModalProvider>
        <div className="min-h-screen flex flex-col justify-between bg-[#fdf8f4] text-[#3f2e2e] selection:bg-emerald-500 selection:text-white">
          <LandingHeader />
          <main className="flex-grow">
            <Outlet />
          </main>
          <LandingFooter />
        </div>
      </GpsOrderModalProvider>
    </LeadModalProvider>
  );
}
