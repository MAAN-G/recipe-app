import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import App from './App';
import './styles/globals.css';

// Apply stored theme before first render to prevent flash
const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

// Register the service worker (production or dev with VITE_SW=true)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SW] Registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[SW] Registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
