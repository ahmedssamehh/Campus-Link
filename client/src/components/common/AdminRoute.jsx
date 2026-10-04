import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../ui/PageLoader';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Wait for the stored session to be restored before deciding
  if (loading) {
    return <PageLoader message="Loading…" />;
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin or owner
  if (user?.role !== 'admin' && user?.role !== 'owner') {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default AdminRoute;
