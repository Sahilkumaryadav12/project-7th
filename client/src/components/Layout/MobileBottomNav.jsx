import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Pill, PlusCircle, BarChart3, User, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav = () => {
  const { isCaregiver } = useAuth();

  const patientNav = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Medicines', path: '/medicines', icon: Pill },
    { label: 'Add', path: '/medicines/new', icon: PlusCircle, isHighlight: true },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const caregiverNav = [
    { label: 'Patients', path: '/caregiver', icon: Users },
    { label: 'Profile', path: '/profile', icon: User },
  ]; 

  const items = isCaregiver ? caregiverNav : patientNav;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 999,
      padding: '0 0.5rem',
    }} className="mobile-bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        if (item.isHighlight) {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)',
                color: '#fff',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.5)',
                marginTop: '-18px',
              }}
            >
              <Icon size={26} />
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: isActive ? 700 : 500,
            })}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;
