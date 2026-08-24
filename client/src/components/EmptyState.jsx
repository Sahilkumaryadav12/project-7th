import React from 'react';
import { FolderOpen } from 'lucide-react';

const EmptyState = ({ title = 'No Data Available', message = 'No records found matching your criteria.', icon: Icon = FolderOpen, action }) => {
  return (
    <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--text-muted)',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
      }}>
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '1.25rem' }}>{message}</p>
      {action}
    </div>
  );
};

export default EmptyState;
