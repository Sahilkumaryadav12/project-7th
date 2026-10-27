import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMedicineById, deleteMedicine } from '../services/medicineService';
import { getMedicationLogs } from '../services/logService';
import { viewPrescriptionFile } from '../services/prescriptionService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Pill, ArrowLeft, Clock, Utensils, Award, Edit, Trash2, ShieldAlert, FileText, ExternalLink } from 'lucide-react';

const MedicineDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medData, logData] = await Promise.all([
          getMedicineById(id),
          getMedicationLogs({ medicineId: id }),
        ]);
        setMedicine(medData);
        setLogs(logData);
      } catch (err) {
        console.error('[MedicineDetailPage] Error loading medicine details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteMedicine(id);
      navigate('/medicines');
    } catch (err) {
      console.error('[MedicineDetailPage] Delete failed:', err);
    }
  };

  if (loading) return <LoadingSpinner text="Loading medication detail..." />;
  if (!medicine) return <div style={{ padding: '2rem', color: '#f43f5e' }}>Medication not found.</div>;

  return (
    <div>
      <button onClick={() => navigate('/medicines')} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to Medications
      </button>

      {/* Medical Safety Disclaimer */}
      <div className="disclaimer-banner">
        <ShieldAlert size={22} className="disclaimer-icon" />
        <p className="disclaimer-text">
          <strong>Medical Disclaimer:</strong> MediTrack is a medication management and reminder tool. It does not replace professional medical advice. Always follow your healthcare professional's prescription.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
            }}>
              <Pill size={32} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{medicine.name}</h1>
              <p style={{ color: 'var(--accent-teal)', fontWeight: 700, fontSize: '1.05rem' }}>{medicine.dosage}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Adherence Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{medicine.compliance}%</div>
            </div>

            <Link to={`/medicines/${medicine._id}`} className="btn btn-secondary">
              <Edit size={16} /> Edit
            </Link>
            <button onClick={() => setShowDelete(true)} className="btn btn-danger">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Frequency</span>
            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{medicine.frequency.replace('_', ' ').toUpperCase()}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Scheduled Times</span>
            <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>{medicine.reminderTimes?.join(', ')}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Food Instruction</span>
            <strong style={{ color: 'var(--accent-teal)', fontSize: '0.95rem' }}>{medicine.foodInstruction.replace('_', ' ').toUpperCase()}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Start Date</span>
            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{new Date(medicine.startDate).toLocaleDateString()}</strong>
          </div>
        </div>

        {medicine.notes && (
          <div style={{ marginTop: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem 1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-primary)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>Notes & Instructions</span>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{medicine.notes}</p>
          </div>
        )}

        {medicine.prescription && (
          <div style={{
            marginTop: '1.25rem',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', padding: '0.5rem', borderRadius: '8px' }}>
                <FileText size={20} />
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                  {medicine.prescription.doctorName ? `Prescribed by Dr. ${medicine.prescription.doctorName}` : 'From Uploaded Prescription'}
                </strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Date: {medicine.prescription.prescriptionDate ? new Date(medicine.prescription.prescriptionDate).toLocaleDateString() : 'N/A'}
                  {medicine.prescription.notes ? ` • Note: "${medicine.prescription.notes}"` : ''}
                </span>
              </div>
            </div>
            {medicine.prescription.fileUrl && (
              <button
                type="button"
                onClick={() => viewPrescriptionFile(medicine.prescription._id || medicine.prescriptionId, medicine.prescription.fileType)}
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={14} /> View Original Document
              </button>
            )}
          </div>
        )}
      </div>

      {/* Log History for this medicine */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Historical Dose Records</h3>

        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No log history recorded yet for this medication.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Time</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Taken At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 600 }}>
                      {new Date(log.scheduledDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--accent-cyan)' }}>{log.scheduledTime}</td>
                    <td style={{ padding: '0.75rem' }}><StatusBadge status={log.status} /></td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      {log.takenAt ? new Date(log.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Medication"
        message={`Are you sure you want to delete ${medicine.name}? All associated dose logs will be removed.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default MedicineDetailPage;
