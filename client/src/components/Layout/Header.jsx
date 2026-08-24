import React from 'react';
import { Bell, HeartPulse, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user } = useAuth();

  return (
    <header style={{
      height: '64px',
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'none' }} className="mobile-brand">
          <HeartPulse size={24} color="var(--accent-primary)" />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>MediTrack</span>
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Welcome back, <strong style={{ color: '#fff' }}>{user?.name}</strong> 👋
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Notifications">
          <Bell size={18} />
        </button>

        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-teal) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
