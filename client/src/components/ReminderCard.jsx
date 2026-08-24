import React from 'react';
import { Bell, CheckCircle2, AlarmClock, X } from 'lucide-react';

const ReminderCard = ({ reminder, onTaken, onSnooze, onDismiss }) => {
  if (!reminder) return null;

  const medicine = reminder.medicineId || reminder.medicine || {};

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', position: 'relative' }}>
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.5)',
        }}>
          <Bell size={32} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
          Medication Due Now!
        </h3>
        <p style={{ color: 'var(--accent-teal)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          {medicine.name} — {medicine.dosage}
        </p>

        {medicine.foodInstruction && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
            Instruction: <strong>{medicine.foodInstruction.replace('_', ' ').toUpperCase()}</strong>
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => onTaken(reminder.log?._id || reminder._id)}
            className="btn btn-success btn-lg"
            style={{ width: '100%' }}
          >
            <CheckCircle2 size={20} />
            <span>Mark as Taken</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onSnooze(reminder.log?._id || reminder._id, 15)}
              className="btn btn-warning"
              style={{ flex: 1 }}
            >
              <AlarmClock size={16} /> Snooze 15m
            </button>
            <button
              onClick={() => onSnooze(reminder.log?._id || reminder._id, 30)}
              className="btn btn-warning"
              style={{ flex: 1 }}
            >
              <AlarmClock size={16} /> Snooze 30m
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '0.25rem' }}
          >
            Dismiss (Remind Later)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderCard;
