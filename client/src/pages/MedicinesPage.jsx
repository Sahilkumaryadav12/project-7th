import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMedicines, deleteMedicine } from '../services/medicineService';
import MedicineCard from '../components/MedicineCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Pill, Plus, Search, FileText } from 'lucide-react';

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const fetchList = async () => {
    try {
      const data = await getMedicines();
      setMedicines(data);
    } catch (err) {
      console.error('[MedicinesPage] Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteMedicine(deleteId);
      setMedicines(prev => prev.filter(m => m._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('[MedicinesPage] Error deleting medicine:', err);
    }
  };

  const [filterType, setFilterType] = useState('all'); // 'all', 'prescribed', 'direct'

  const prescriptionCount = medicines.filter(m => m.prescription || m.prescriptionId).length;
  const directCount = medicines.filter(m => !m.prescription && !m.prescriptionId).length;

  const filteredMedicines = medicines.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.prescription?.doctorName && m.prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'prescribed') return Boolean(m.prescription || m.prescriptionId);
    if (filterType === 'direct') return !m.prescription && !m.prescriptionId;
    return true;
  });

  if (loading) return <LoadingSpinner text="Loading medications..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Medications</h1>
          <p className="page-subtitle">Manage your active prescriptions, dosages, and reminder schedules</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/prescriptions" className="btn btn-secondary">
            <FileText size={18} /> View Prescriptions
          </Link>
          <Link to="/medicines/new" className="btn btn-primary">
            <Plus size={18} /> Add New Medication
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.75rem' }}
            placeholder="Search by name, dose, or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('all')}
          >
            All ({medicines.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'prescribed' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('prescribed')}
          >
            From Prescriptions ({prescriptionCount})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'direct' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('direct')}
          >
            Direct ({directCount})
          </button>
        </div>
      </div>

      {filteredMedicines.length === 0 ? (
        <EmptyState
          title="No Medications Found"
          message={searchTerm ? 'No results matched your search term.' : 'You have not added any medications to your account yet.'}
          icon={Pill}
          action={
            <Link to="/medicines/new" className="btn btn-primary">
              <Plus size={18} /> Add Your First Medicine
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredMedicines.map((med) => (
            <MedicineCard
              key={med._id}
              medicine={med}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Medication"
        message="Are you sure you want to delete this medication? All associated historical dose logs will be permanently removed."
        confirmText="Delete Medication"
      />
    </div>
  );
};

export default MedicinesPage;
