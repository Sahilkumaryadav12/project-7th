import React, { useEffect, useState } from 'react';
import { getMedicationLogs } from '../services/logService';
import { getMedicines } from '../services/medicineService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { History, Filter, Search } from 'lucide-react';

const HistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState('');
  const [filterMedicine, setFilterMedicine] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchLogs = async () => {
    try {
      const [logData, medData] = await Promise.all([
        getMedicationLogs({
          date: filterDate || undefined,
          medicineId: filterMedicine || undefined,
          status: filterStatus || undefined,
        }),
        getMedicines(),
      ]);
      setLogs(logData);
      setMedicines(medData);
    } catch (err) {
      console.error('[HistoryPage] Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterDate, filterMedicine, filterStatus]);

  if (loading) return <LoadingSpinner text="Loading log history..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Medication Log History</h1>
          <p className="page-subtitle">Complete historical record of all past dose instances and compliance</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-teal)', fontWeight: 700 }}>
          <Filter size={18} /> Filters:
        </div>

        <div style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Date</label>
          <input
            type="date"
            className="form-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter Medicine</label>
          <select
            className="form-select"
            value={filterMedicine}
            onChange={(e) => setFilterMedicine(e.target.value)}
          >
            <option value="">All Medicines</option>
            {medicines.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter Status</label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="taken">Taken</option>
            <option value="missed">Missed</option>
            <option value="upcoming">Upcoming</option>
            <option value="snoozed">Snoozed</option>
          </select>
        </div>

        {(filterDate || filterMedicine || filterStatus) && (
          <button
            onClick={() => {
              setFilterDate('');
              setFilterMedicine('');
              setFilterStatus('');
            }}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '1.25rem' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No Logs Found"
          message="No historical medication logs match the selected filter criteria."
          icon={History}
        />
      ) : (
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Date</th>
                <th style={{ padding: '0.75rem' }}>Time</th>
                <th style={{ padding: '0.75rem' }}>Medication</th>
                <th style={{ padding: '0.75rem' }}>Dosage</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Logged Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const med = log.medicineId || {};
                return (
                  <tr key={log._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 600 }}>
                      {new Date(log.scheduledDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{log.scheduledTime}</td>
                    <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 700 }}>{med.name || 'Unknown'}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{med.dosage || '—'}</td>
                    <td style={{ padding: '0.75rem' }}><StatusBadge status={log.status} /></td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {log.takenAt ? new Date(log.takenAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
