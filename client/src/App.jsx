import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MedicinesPage from './pages/MedicinesPage';
import MedicineFormPage from './pages/MedicineFormPage';
import MedicineDetailPage from './pages/MedicineDetailPage';
import TodayPage from './pages/TodayPage';
import HistoryPage from './pages/HistoryPage';
import ReportsPage from './pages/ReportsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import CaregiverDashboardPage from './pages/CaregiverDashboardPage';
import CaregiverPatientDetailPage from './pages/CaregiverPatientDetailPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Patient & Caregiver Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/medicines" element={<MedicinesPage />} />
              <Route path="/medicines/new" element={<MedicineFormPage />} />
              <Route path="/medicines/:id" element={<MedicineDetailPage />} />
              <Route path="/today" element={<TodayPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Caregiver-Gated Routes */}
              <Route element={<ProtectedRoute allowedRoles={['caregiver']} />}>
                <Route path="/caregiver" element={<CaregiverDashboardPage />} />
                <Route path="/caregiver/patients/:id" element={<CaregiverPatientDetailPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/dashboard"  replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
