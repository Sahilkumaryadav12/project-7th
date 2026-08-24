import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignedPatients, invitePatient } from '../services/caregiverService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Users, UserPlus, ArrowRight, ShieldCheck, Award, HeartPulse } from 'lucide-react';

const CaregiverDashboardPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [patientEmail, setPatientEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPatients = async () => {
    try {
      const data = await getAssignedPatients();
      setPatients(data);
    } catch (err) {
      console.error('[CaregiverDashboardPage] Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await invitePatient(patientEmail);
      setSuccessMsg(res.message || 'Invitation sent successfully!');
      setPatientEmail('');
      setTimeout(() => setIsInviteModalOpen(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading assigned patients..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Caregiver Supervision Dashboard</h1>
          <p className="page-subtitle">Read-only compliance monitoring for assigned patients</p>
        </div>
        <button onClick={() => setIsInviteModalOpen(true)} className="btn btn-primary">
          <UserPlus size={18} /> Invite Patient
        </button>
      </div>

      {patients.length === 0 ? (
        <EmptyState
          title="No Assigned Patients"
          message="You currently have no accepted patient connections. Send an invitation to a patient by their email address."
          icon={Users}
          action={
            <button onClick={() => setIsInviteModalOpen(true)} className="btn btn-primary">
              <UserPlus size={18} /> Send Invitation
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {patients.map((item) => {
            const patient = item.patient || {};
            const stats = item.stats || {};
            const compliance = stats.compliance || 100;

            return (
              <div key={item.relationshipId} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-primary) 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                  }}>
                    {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{patient.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{patient.email}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compliance Rate</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: compliance >= 80 ? '#10b981' : '#f43f5e' }}>
                      {compliance}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Medicines</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                      {stats.totalMedicines || 0}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taken Today</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                      {stats.takenToday || 0} / {stats.totalToday || 0}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missed Today</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: (stats.missedToday || 0) > 0 ? '#f43f5e' : '#fff' }}>
                      {stats.missedToday || 0}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={14} /> Read-Only Supervision
                  </span>

                  <Link to={`/caregiver/patients/${patient._id}`} className="btn btn-primary btn-sm">
                    <span>View Detail</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Patient to Caregiver Supervision">
        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleInviteSubmit}>
          <div className="form-group">
            <label className="form-label">Patient Email Address *</label>
            <input
              type="email"
              className="form-input"
              placeholder="patient@meditrack.com"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', marginTop: '0.35rem' }}>
              An invitation request will be generated for the patient to accept in their account settings.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            <UserPlus size={18} />
            <span>{submitting ? 'Sending Request...' : 'Send Caregiver Request'}</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CaregiverDashboardPage;
