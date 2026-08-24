import React, { useEffect, useState } from 'react';
import { getPrescriptions, uploadPrescription, deletePrescription } from '../services/prescriptionService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { FileText, Upload, Trash2, ExternalLink, Calendar, UserCheck } from 'lucide-react';

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [doctorName, setDoctorName] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const fetchList = async () => {
    try {
      const data = await getPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      console.error('[PrescriptionsPage] Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload (PDF, JPG, PNG)');
      return;
    }

    setError('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('doctorName', doctorName);
    formData.append('prescriptionDate', prescriptionDate);
    formData.append('notes', notes);

    try {
      await uploadPrescription(formData);
      setIsModalOpen(false);
      setFile(null);
      setDoctorName('');
      setNotes('');
      await fetchList();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Ensure file is PDF, JPG, or PNG under 5MB.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePrescription(deleteId);
      setPrescriptions(prev => prev.filter(p => p._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('[PrescriptionsPage] Error deleting prescription:', err);
    }
  };

  if (loading) return <LoadingSpinner text="Loading prescription documents..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Prescription Documents</h1>
          <p className="page-subtitle">Upload and store medical prescriptions from your healthcare providers</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Upload size={18} /> Upload Prescription
        </button>
      </div>

      {prescriptions.length === 0 ? (
        <EmptyState
          title="No Prescriptions Uploaded"
          message="Upload doctor prescriptions (PDF/JPG/PNG) to keep all your medical records in one place."
          icon={FileText}
          action={
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Upload size={18} /> Upload Prescription Now
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {prescriptions.map((p) => (
            <div key={p._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--accent-cyan)',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                    {p.doctorName ? `Dr. ${p.doctorName}` : 'Prescription Document'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Type: <strong style={{ uppercase: true, color: '#fff' }}>{p.fileType.toUpperCase()}</strong>
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} color="var(--accent-teal)" />
                  <span>Prescription Date: {new Date(p.prescriptionDate).toLocaleDateString()}</span>
                </div>
                {p.notes && <p style={{ fontStyle: 'italic', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>"{p.notes}"</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <a
                  href={p.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink size={14} /> View File
                </a>

                <button onClick={() => setDeleteId(p._id)} className="btn btn-danger btn-sm">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Prescription Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Prescription File">
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleUploadSubmit}>
          <div className="form-group">
            <label className="form-label">Prescription File (PDF, JPG, PNG, max 5MB) *</label>
            <input
              type="file"
              className="form-input"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Doctor Name (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dr. Marcus Vance"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prescription Date *</label>
            <input
              type="date"
              className="form-input"
              value={prescriptionDate}
              onChange={(e) => setPrescriptionDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Prescribed for 14 days post-op recovery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            <Upload size={18} />
            <span>{submitting ? 'Uploading...' : 'Upload Prescription'}</span>
          </button>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Prescription"
        message="Are you sure you want to delete this prescription document?"
        confirmText="Delete File"
      />
    </div>
  );
};

export default PrescriptionsPage;
