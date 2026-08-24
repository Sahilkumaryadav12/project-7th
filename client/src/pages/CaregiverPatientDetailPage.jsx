import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatientDetail } from '../services/caregiverService';
import ComplianceCard from '../components/ComplianceCard';
import MedicineCard from '../components/MedicineCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, User, ShieldCheck, AlertTriangle, Phone, Mail } from 'lucide-react';

const CaregiverPatientDetailPage = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPatientDetail(patientId);
        setData(res);
      } catch (err) {
        setError(err.response?.data?.error || 'Access denied or failed to load patient details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  if (loading) return <LoadingSpinner text="Loading patient adherence details..." />;
  if (error) return <div style={{ padding: '2rem', color: '#f43f5e' }}>{error}</div>;

  const { patient, overallCompliance, medicines, recentLogs, missedDoses } = data || {};

  return (
    <div>
      <button onClick={() => navigate('/caregiver')} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to Patients List
      </button>

      {/* Patient Header Card */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-teal) 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
            }}>
              {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{patient.name}</h1>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={14} /> {patient.email}</span>
                {patient.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14} /> {patient.phone}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(20, 184, 166, 0.15)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
            <ShieldCheck size={16} color="var(--accent-teal)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: 700 }}>Read-Only Caregiver Access</span>
          </div>
        </div>

        {patient.emergencyContact?.name && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Emergency Contact:</strong> {patient.emergencyContact.name} ({patient.emergencyContact.phone || 'No phone provided'})
          </div>
        )}
      </div>

      {/* Compliance Overview & Missed Alert */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <ComplianceCard percentage={overallCompliance} title="Patient 30-Day Adherence" />

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Missed Doses (Past 30 Days)</span>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: missedDoses?.length > 0 ? '#f43f5e' : '#fff', marginTop: '0.25rem' }}>
            {missedDoses?.length || 0}
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)' }}>Requires caregiver monitoring</p>
        </div>
      </div>

      {/* Patient Active Medicines Section (Read Only) */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Active Medications Schedule</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {medicines?.map((med) => (
          <MedicineCard key={med._id} medicine={med} readOnly={true} />
        ))}
      </div>

      {/* Log History */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Recent Log History</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Date</th>
                <th style={{ padding: '0.75rem' }}>Time</th>
                <th style={{ padding: '0.75rem' }}>Medication</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Taken Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs?.map((log) => {
                const med = log.medicineId || {};
                return (
                  <tr key={log._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 600 }}>
                      {new Date(log.scheduledDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--accent-cyan)' }}>{log.scheduledTime}</td>
                    <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 700 }}>{med.name}</td>
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
      </div>
    </div>
  );
};

export default CaregiverPatientDetailPage;
