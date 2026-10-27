import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, Clock, Utensils, Edit, Trash2, Award, FileText } from 'lucide-react';
import { viewPrescriptionFile } from '../services/prescriptionService';

const foodInstructionLabels = {
  before_food: 'Take Before Food',
  after_food: 'Take After Food',
  with_food: 'Take With Food',
  no_restriction: 'No Food Restriction',
};

const MedicineCard = ({ medicine, onDelete, readOnly = false }) => {
  const compliance = medicine.compliance !== undefined ? medicine.compliance : 100;

  return (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Pill size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{medicine.name}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: 600 }}>{medicine.dosage}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: compliance >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            color: compliance >= 80 ? '#10b981' : '#f43f5e',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}>
            <Award size={13} /> {compliance}%
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={15} color="var(--accent-cyan)" />
          <span>Times: {medicine.reminderTimes?.join(', ') || '08:00'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Utensils size={15} color="var(--accent-teal)" />
          <span>{foodInstructionLabels[medicine.foodInstruction] || 'No Restriction'}</span>
        </div>
      </div>

      {medicine.prescription && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.4rem',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          color: 'var(--accent-cyan)',
          padding: '0.4rem 0.65rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          fontWeight: 600,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: '1 1 auto' }}>
            <FileText size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Prescription: {medicine.prescription.doctorName ? `Dr. ${medicine.prescription.doctorName}` : 'Document'}
            </span>
          </div>
          {medicine.prescription.fileUrl && (
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-teal)',
                textDecoration: 'underline',
                fontSize: '0.75rem',
                flexShrink: 0,
                cursor: 'pointer',
                padding: 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                viewPrescriptionFile(medicine.prescription._id || medicine.prescriptionId, medicine.prescription.fileType);
              }}
            >
              View Document
            </button>
          )}
        </div>
      )}

      {medicine.notes && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
          "{medicine.notes}"
        </p>
      )}

      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
          <Link to={`/medicines/${medicine._id}`} className="btn btn-secondary btn-sm">
            <Edit size={14} /> Edit
          </Link>
          <button onClick={() => onDelete(medicine._id)} className="btn btn-danger btn-sm">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicineCard;
