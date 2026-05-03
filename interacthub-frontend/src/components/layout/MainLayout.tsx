import type { ReactNode } from 'react';
import Navbar from './Navbar';

const MainLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-linkedin-gray">
    <Navbar />
    <main className="pt-14 max-w-6xl mx-auto px-4 py-6">
      {children}
    </main>
  </div>
);
export default MainLayout;