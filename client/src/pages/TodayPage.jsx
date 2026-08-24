import React, { useEffect, useState } from 'react';
import { getMedicationLogs, updateLogStatus } from '../services/logService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Calendar, CheckCircle2, AlarmClock, XCircle, Pill } from 'lucide-react';

const TodayPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayLogs = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const data = await getMedicationLogs({ date: todayStr });
      setLogs(data);
    } catch (err) {
      console.error('[TodayPage] Error fetching today logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayLogs();
  }, []);

  const handleStatusChange = async (logId, status, minutes = 15) => {
    try {
      await updateLogStatus(logId, { status, snoozedMinutes: minutes });
      await fetchTodayLogs();
    } catch (err) {
      console.error('[TodayPage] Error updating status:', err);
    }
  };

  if (loading) return <LoadingSpinner text="Loading today's schedule..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Today's Schedule</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No Scheduled Doses Today"
          message="You have no medication doses due today."
          icon={Calendar}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '720px' }}>
          {logs.map((log) => {
            const med = log.medicineId || {};
            return (
              <div
                key={log._id}
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    color: '#fff',
                    textAlign: 'center',
                    minWidth: '70px',
                  }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{log.scheduledTime}</div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{med.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: 600 }}>{med.dosage}</span>
                    {med.foodInstruction && (
                      <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Instruction: <strong>{med.foodInstruction.replace('_', ' ').toUpperCase()}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <StatusBadge status={log.status} />

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {log.status !== 'taken' && (
                      <button
                        onClick={() => handleStatusChange(log._id, 'taken')}
                        className="btn btn-success btn-sm"
                      >
                        <CheckCircle2 size={16} /> Mark Taken
                      </button>
                    )}

                    {log.status === 'upcoming' && (
                      <button
                        onClick={() => handleStatusChange(log._id, 'snoozed', 15)}
                        className="btn btn-warning btn-sm"
                      >
                        <AlarmClock size={16} /> Snooze 15m
                      </button>
                    )}

                    {log.status !== 'missed' && (
                      <button
                        onClick={() => handleStatusChange(log._id, 'missed')}
                        className="btn btn-danger btn-sm"
                      >
                        <XCircle size={16} /> Mark Missed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodayPage;
