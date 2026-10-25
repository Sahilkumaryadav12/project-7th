import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrescriptions, uploadPrescription, deletePrescription, addPrescriptionMedicinesToTracker } from '../services/prescriptionService';
import { readPrescription } from '../services/prescriptionOcr';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { FileText, Upload, Trash2, ExternalLink, Calendar, Pill, Plus, X, ScanText } from 'lucide-react';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const defaultTimes = {
  once_daily: ['08:00'],
  twice_daily: ['08:00', '20:00'],
  thrice_daily: ['08:00', '14:00', '20:00'],
  four_times_daily: ['08:00', '12:00', '16:00', '20:00'],
  custom: ['08:00'],
};

const emptySuggestion = () => ({
  name: '', dosage: '', frequency: 'once_daily', startDate: today(), endDate: '',
  reminderTimes: ['08:00'], foodInstruction: 'no_restriction', notes: '', selected: true,
});

const PrescriptionsPage = () => {
  const navigate = useNavigate();
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
  const [reviewPrescription, setReviewPrescription] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [rawOcrText, setRawOcrText] = useState('');
  const [ocrStatus, setOcrStatus] = useState('');
  const [scanNotice, setScanNotice] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [importing, setImporting] = useState(false);

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

    let uploadedPrescription;
    try {
      uploadedPrescription = await uploadPrescription(formData);
      setIsModalOpen(false);
      setFile(null);
      setDoctorName('');
      setNotes('');
      await fetchList();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Ensure file is PDF, JPG, or PNG under 5MB.');
      setSubmitting(false);
      return;
    }

    try {
      setOcrStatus('Reading the prescription...');
      setScanNotice('');
      const result = await readPrescription(file, progress => {
        const percent = Math.round((progress.progress || 0) * 100);
        setOcrStatus(progress.step ? `${progress.step} (${percent}%)` : `Reading prescription (${percent}%)`);
      });
      setRawOcrText(result.text);
      if (result.candidates.length > 0) {
        setSuggestions(result.candidates);
        setReviewPrescription(uploadedPrescription);
        setReviewError('');
      } else {
        setScanNotice('The file was uploaded, but no medication lines were detected. You can add each medicine manually from the prescription card.');
      }
    } catch (scanError) {
      console.error('[PrescriptionsPage] Prescription text extraction failed:', scanError);
      const reason = scanError instanceof Error && scanError.message
        ? ` (${scanError.message.slice(0, 180)})`
        : '';
      setScanNotice(`The prescription was uploaded, but automatic reading failed${reason}. Open its card to add medicines manually.`);
    } finally {
      setOcrStatus('');
      setSubmitting(false);
    }
  };

  const updateSuggestion = (index, patch) => {
    setSuggestions(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const handleImportDetected = async () => {
    if (!reviewPrescription) return;
    const selected = suggestions.filter(item => item.selected);
    if (selected.length === 0) {
      setReviewError('Select at least one medication to add.');
      return;
    }
    if (selected.some(item => !item.name.trim() || !item.dosage.trim() || !item.startDate || item.reminderTimes.length === 0)) {
      setReviewError('Each selected medicine needs a name, dosage, start date, and at least one reminder time.');
      return;
    }
    if (selected.some(item => item.reminderTimes.some(time => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))) {
      setReviewError('Reminder times must use 24-hour HH:mm format, for example 08:30.');
      return;
    }

    setImporting(true);
    setReviewError('');
    try {
      const medicines = selected.map(({ selected: _selected, ...item }) => ({
        ...item,
        reminderTimes: item.reminderTimes.filter(Boolean),
      }));
      await addPrescriptionMedicinesToTracker(reviewPrescription._id, medicines);
      setReviewPrescription(null);
      setSuggestions([]);
      navigate('/medicines');
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Could not add the detected medicines. Please review the details and try again.');
    } finally {
      setImporting(false);
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
      {scanNotice && (
        <div role="status" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {scanNotice}
          <button type="button" onClick={() => setScanNotice('')} aria-label="Dismiss" style={{ float: 'right', background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}
      {ocrStatus && <p role="status" style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }}><ScanText size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />{ocrStatus}</p>}
      <div className="page-header">
        <div>
          <h1 className="page-title">Prescription Documents</h1>
          <p className="page-subtitle">Upload a prescription to detect its medicines and prepare tracker schedules for review</p>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <a
                  href={p.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink size={14} /> View File
                </a>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/medicines/new', { state: { prescription: p } })}
                    className="btn btn-primary btn-sm"
                  >
                    <Pill size={14} /> Add to Tracker
                  </button>
                  <button onClick={() => setDeleteId(p._id)} className="btn btn-danger btn-sm">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Prescription Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !submitting && setIsModalOpen(false)} title="Upload Prescription File">
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
            <span>{submitting ? 'Uploading and reading…' : 'Upload & Detect Medicines'}</span>
          </button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(reviewPrescription)} onClose={() => !importing && setReviewPrescription(null)} title="Review Detected Medicines">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Check every detected name, dose, frequency, and reminder time against the uploaded prescription. OCR can miss or misread details; confirm the schedule before adding anything.
        </p>
        {reviewError && <div role="alert" style={{ color: '#f43f5e', padding: '0.75rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.12)' }}>{reviewError}</div>}

        <div style={{ display: 'grid', gap: '1rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {suggestions.map((item, index) => (
            <section key={index} className="glass-card" style={{ padding: '1rem', opacity: item.selected ? 1 : 0.55 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#fff', fontWeight: 700 }}>
                  <input type="checkbox" checked={item.selected} onChange={event => updateSuggestion(index, { selected: event.target.checked })} />
                  Medicine {index + 1}
                </label>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setSuggestions(current => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove medicine ${index + 1}`}><X size={15} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <div className="form-group"><label className="form-label">Medicine name *</label><input className="form-input" value={item.name} onChange={event => updateSuggestion(index, { name: event.target.value })} /></div>
                <div className="form-group"><label className="form-label">Dose *</label><input className="form-input" value={item.dosage} placeholder="e.g. 1 tablet, 500 mg" onChange={event => updateSuggestion(index, { dosage: event.target.value })} /></div>
                <div className="form-group"><label className="form-label">Frequency</label><select className="form-select" value={item.frequency} onChange={event => updateSuggestion(index, { frequency: event.target.value, reminderTimes: defaultTimes[event.target.value] })}>
                  <option value="once_daily">Once daily</option><option value="twice_daily">Twice daily</option><option value="thrice_daily">Three times daily</option><option value="four_times_daily">Four times daily</option><option value="custom">Custom</option>
                </select></div>
                <div className="form-group"><label className="form-label">Reminder times (24-hour, comma separated)</label><input className="form-input" value={item.reminderTimes.join(', ')} placeholder="08:00, 20:00" onChange={event => updateSuggestion(index, { reminderTimes: event.target.value.split(/[,;\s]+/).filter(Boolean) })} /></div>
                <div className="form-group"><label className="form-label">Start date</label><input type="date" className="form-input" value={item.startDate} onChange={event => updateSuggestion(index, { startDate: event.target.value })} /></div>
                <div className="form-group"><label className="form-label">End date (optional)</label><input type="date" className="form-input" value={item.endDate} onChange={event => updateSuggestion(index, { endDate: event.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Food instruction</label><select className="form-select" value={item.foodInstruction} onChange={event => updateSuggestion(index, { foodInstruction: event.target.value })}>
                <option value="no_restriction">No restriction</option><option value="before_food">Before food</option><option value="with_food">With food</option><option value="after_food">After food</option>
              </select></div>
            </section>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setSuggestions(current => [...current, emptySuggestion()])} disabled={suggestions.length >= 50}><Plus size={16} /> Add missed medicine</button>
          <button type="button" className="btn btn-primary" onClick={handleImportDetected} disabled={importing}>
            <Pill size={16} /> {importing ? 'Adding to tracker…' : `Add ${suggestions.filter(item => item.selected).length} to Tracker`}
          </button>
        </div>
        {rawOcrText && <details style={{ marginTop: '1rem', color: 'var(--text-muted)' }}><summary style={{ cursor: 'pointer' }}>View extracted text</summary><pre style={{ whiteSpace: 'pre-wrap', maxHeight: '12rem', overflow: 'auto', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>{rawOcrText}</pre></details>}
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
