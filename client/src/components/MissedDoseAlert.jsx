import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const MissedDoseAlert = ({ missedDose }) => {
  if (!missedDose) return null;

  const medicine = missedDose.medicineId || missedDose.medicine || {};

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(244, 63, 94, 0.05) 100%)',
      border: '1px solid rgba(244, 63, 94, 0.4)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 14px rgba(244, 63, 94, 0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          background: 'var(--status-missed)',
          color: '#fff',
          padding: '0.6rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <AlertTriangle size={22} />
        </div>
        <div>
          <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>
            Missed Dose Alert: {medicine.name || 'Medication'} ({medicine.dosage || ''})
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Scheduled for {missedDose.scheduledTime || 'earlier today'}. Please take as advised by your physician.
          </p>
        </div>
      </div>

      <Link
        to={medicine._id ? `/medicines/${medicine._id}` : '/medicines'}
        className="btn btn-danger btn-sm"
        style={{ textTransform: 'none' }}
      >
        <span>View Medication</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
};

export default MissedDoseAlert;
