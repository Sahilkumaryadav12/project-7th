import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createMedicine, getMedicineById, updateMedicine } from '../services/medicineService';
import { getPrescriptions } from '../services/prescriptionService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Pill, ArrowLeft, Plus, Trash2, Save, FileText } from 'lucide-react';

const MedicineFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const sourcePrescription = !isEdit ? location.state?.prescription : null;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('once_daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [reminderTimes, setReminderTimes] = useState(['08:00']);
  const [foodInstruction, setFoodInstruction] = useState('no_restriction');
  const [notes, setNotes] = useState(sourcePrescription?.notes ? `Prescription note: ${sourcePrescription.notes}` : '');
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(sourcePrescription?._id || '');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initData = async () => {
      try {
        const [prescriptionsList, medData] = await Promise.all([
          getPrescriptions().catch(() => []),
          isEdit ? getMedicineById(id) : Promise.resolve(null),
        ]);
        setPrescriptions(prescriptionsList || []);

        if (medData) {
          setName(medData.name || '');
          setDosage(medData.dosage || '');
          setFrequency(medData.frequency || 'once_daily');
          setStartDate(medData.startDate ? new Date(medData.startDate).toISOString().split('T')[0] : '');
          setEndDate(medData.endDate ? new Date(medData.endDate).toISOString().split('T')[0] : '');
          setReminderTimes(medData.reminderTimes || ['08:00']);
          setFoodInstruction(medData.foodInstruction || 'no_restriction');
          setNotes(medData.notes || '');
          setSelectedPrescriptionId(medData.prescriptionId?._id || medData.prescriptionId || medData.prescription?._id || '');
        }
      } catch (err) {
        setError('Failed to fetch medication details');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, isEdit]);

  const handleFrequencyChange = (freq) => {
    setFrequency(freq);
    if (freq === 'once_daily') setReminderTimes(['08:00']);
    else if (freq === 'twice_daily') setReminderTimes(['08:00', '20:00']);
    else if (freq === 'thrice_daily') setReminderTimes(['08:00', '14:00', '20:00']);
    else if (freq === 'four_times_daily') setReminderTimes(['08:00', '12:00', '16:00', '20:00']);
  };

  const handleTimeChange = (index, value) => {
    const updated = [...reminderTimes];
    updated[index] = value;
    setReminderTimes(updated);
  };

  const addTimeSlot = () => {
    setReminderTimes([...reminderTimes, '12:00']);
  };

  const removeTimeSlot = (index) => {
    if (reminderTimes.length <= 1) return;
    setReminderTimes(reminderTimes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      name,
      dosage,
      frequency,
      startDate,
      endDate: endDate || null,
      reminderTimes,
      foodInstruction,
      notes,
      prescriptionId: selectedPrescriptionId || null,
    };

    try {
      if (isEdit) {
        await updateMedicine(id, payload);
      } else {
        await createMedicine(payload);
      }
      navigate('/medicines');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save medicine');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading medicine details..." />;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to Medications
      </button>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)',
            padding: '0.65rem',
            borderRadius: '12px',
            color: '#fff',
          }}>
            <Pill size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
              {isEdit ? 'Edit Medication' : sourcePrescription ? 'Add Medication from Prescription' : 'Add New Medication'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {sourcePrescription
                ? `Enter the medication instructions exactly as written${sourcePrescription.doctorName ? ` by Dr. ${sourcePrescription.doctorName}` : ''}. A schedule will be created from the details you provide.`
                : 'Configure schedule and reminder timings'}
            </p>
          </div>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Medication Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Paracetamol"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dosage *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 500mg, 1 Tablet, 5ml"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Frequency *</label>
            <select
              className="form-select"
              value={frequency}
              onChange={(e) => handleFrequencyChange(e.target.value)}
            >
              <option value="once_daily">Once Daily</option>
              <option value="twice_daily">Twice Daily</option>
              <option value="thrice_daily">Thrice Daily</option>
              <option value="four_times_daily">Four Times Daily</option>
              <option value="custom">Custom Timings</option>
            </select>
          </div>

          {/* Dynamic Reminder Times */}
          <div className="form-group">
            <label className="form-label">Scheduled Reminder Times (24h HH:mm) *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reminderTimes.map((time, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                    required
                  />
                  {reminderTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(idx)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.65rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTimeSlot}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.5rem' }}
            >
              <Plus size={14} /> Add Time Slot
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Food Instruction</label>
            <select
              className="form-select"
              value={foodInstruction}
              onChange={(e) => setFoodInstruction(e.target.value)}
            >
              <option value="no_restriction">No Restriction</option>
              <option value="before_food">Before Food</option>
              <option value="after_food">After Food</option>
              <option value="with_food">With Food</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Link to Prescription Document (Optional)</label>
            <select
              className="form-select"
              value={selectedPrescriptionId}
              onChange={(e) => setSelectedPrescriptionId(e.target.value)}
            >
              <option value="">None (Self-managed medication)</option>
              {prescriptions.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.doctorName ? `Dr. ${p.doctorName}` : 'Prescription Document'} — {new Date(p.prescriptionDate).toLocaleDateString()}
                </option>
              ))}
            </select>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem', display: 'block' }}>
              Linking attaches doctor details and document access to this medication card.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Instructions</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Take with a full glass of water, finish whole antibiotic course."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            <Save size={18} />
            <span>{submitting ? 'Saving...' : isEdit ? 'Update Medication' : 'Save Medication'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default MedicineFormPage;
