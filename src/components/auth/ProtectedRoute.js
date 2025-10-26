import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;