// Campus Link - Application Entry Point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSentry } from './instrumentation/sentry';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
