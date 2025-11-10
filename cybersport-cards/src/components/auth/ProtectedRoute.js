import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = () => {
  const { isAdmin, user, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }
  
  // Для админ-панели проверяем isAdmin, для профиля - просто наличие user
  // Определим по текущему пути, что мы защищаем
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return isAdmin ? <Outlet /> : <Navigate to="/" />;
  }

  // Для обычных защищенных роутов (например, профиль)
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;