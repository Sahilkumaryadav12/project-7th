import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldCheck, Moon, Laptop, Lock } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      setNotifPermission(res);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Preferences & Settings</h1>
          <p className="page-subtitle">Configure notifications, alert triggers, and account security</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} color="var(--accent-primary)" /> Push & Browser Notifications
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Desktop Browser Notifications</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
              Receive instant desktop alerts when a medication dose is scheduled
            </p>
            <span style={{ fontSize: '0.75rem', color: notifPermission === 'granted' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
              Status: {notifPermission.toUpperCase()}
            </span>
          </div>

          {notifPermission !== 'granted' && (
            <button onClick={requestNotifPermission} className="btn btn-primary btn-sm">
              Enable Notifications
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="var(--accent-teal)" /> Security & Session
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <div>Account Role: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{user?.role}</strong></div>
          <div>Registered Email: <strong style={{ color: '#fff' }}>{user?.email}</strong></div>
          <div>Authentication Standard: <strong style={{ color: 'var(--accent-teal)' }}>JWT Bearer Token + bcrypt Hashing</strong></div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
