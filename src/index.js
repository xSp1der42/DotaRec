import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // ИМПОРТ

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* ОБЕРТКА */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);