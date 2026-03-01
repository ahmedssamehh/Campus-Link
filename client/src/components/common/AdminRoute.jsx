import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin or owner
  if (user?.role !== 'admin' && user?.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
