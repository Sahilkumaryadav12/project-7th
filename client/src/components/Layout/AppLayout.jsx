import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import ReminderNotifier from '../ReminderNotifier';

const AppLayout = () => {
  return (
    <div className="app-container">
      {/* Background Notification / In-App Reminder Polling Service */}
      <ReminderNotifier />

      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;
