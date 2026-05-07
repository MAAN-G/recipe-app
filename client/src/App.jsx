import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Header from '@/components/Header';
import ErrorBoundary from '@/components/ErrorBoundary';
import Home from '@/pages/Home';
import Details from '@/pages/Details';
import Favorites from '@/pages/Favorites';
import { useOffline } from '@/hooks/useOffline';

export default function App() {
  // Triggers offline/online toasts globally
  useOffline();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip-to-content for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Header />

      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/meal/:id" element={<Details />} />
          <Route path="/favorites" element={<Favorites />} />
          {/* Catch-all → home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </ErrorBoundary>

      {/* Global toast notifications */}
      <Toaster richColors position="bottom-right" closeButton />
    </div>
  );
}
