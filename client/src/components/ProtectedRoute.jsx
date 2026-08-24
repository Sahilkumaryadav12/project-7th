import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Loading MediTrack...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect caregiver to caregiver portal, patient to dashboard
    return user.role === 'caregiver' ? <Navigate to="/caregiver" replace /> : <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return user.role === 'caregiver' ? <Navigate to="/caregiver" replace /> : <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
