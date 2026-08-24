import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMedicines, deleteMedicine } from '../services/medicineService';
import MedicineCard from '../components/MedicineCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Pill, Plus, Search } from 'lucide-react';

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

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.dosage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading medications..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Medications</h1>
          <p className="page-subtitle">Manage your active prescriptions, dosages, and reminder schedules</p>
        </div>
        <Link to="/medicines/new" className="btn btn-primary">
          <Plus size={18} /> Add New Medication
        </Link>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: '2.75rem' }}
          placeholder="Search by name or dosage..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
