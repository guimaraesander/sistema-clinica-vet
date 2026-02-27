// Caminho: src/components/AdminRoute/index.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = () => {
  const { isAdmin } = useAuth();

  // Se o usuário for admin, mostra a página que a rota está protegendo (Outlet).
  // Se não, redireciona para a página de login do admin.
  return isAdmin ? <Outlet /> : <Navigate to="/admin/login" />;
};

export default AdminRoute;