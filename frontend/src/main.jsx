import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './style/global.css';
import { CartProvider } from './contexts/CartContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx'; // <-- PASSO 1: IMPORTAR
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast/ToastProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
					<ToastProvider>
						<ErrorBoundary>
              <App />
						</ErrorBoundary>
					</ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);