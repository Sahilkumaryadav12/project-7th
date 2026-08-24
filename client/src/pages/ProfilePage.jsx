import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/userService';
import { getPatientRelationships, updateRelationshipStatus } from '../services/caregiverService';
import LoadingSpinner from '../components/LoadingSpinner';
import { User, Phone, Shield, Camera, Save, Check, X, HeartPulse } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUserProfile, isPatient } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age || '');
  const [gender, setGender] = useState(user?.gender || 'prefer_not_to_say');
  const [emergencyName, setEmergencyName] = useState(user?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContact?.phone || '');
  const [profileFile, setProfileFile] = useState(null);

  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchRelationships = async () => {
    if (isPatient) {
      try {
        const data = await getPatientRelationships();
        setRelationships(data);
      } catch (err) {
        console.error('[ProfilePage] Error fetching relationships:', err);
      }
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [isPatient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    if (age) formData.append('age', age);
    formData.append('gender', gender);
    formData.append('emergencyContact', JSON.stringify({ name: emergencyName, phone: emergencyPhone }));
    if (profileFile) {
      formData.append('profileImage', profileFile);
    }

    try {
      const res = await updateProfile(formData);
      updateUserProfile(res.user);
      setMsg({ type: 'success', text: 'Profile details updated successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelationshipAction = async (relId, status) => {
    try {
      await updateRelationshipStatus(relId, status);
      await fetchRelationships();
    } catch (err) {
      console.error('[ProfilePage] Relationship update failed:', err);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Account Profile</h1>
          <p className="page-subtitle">Manage your personal information and caregiver authorizations</p>
        </div>
      </div>

      {msg.text && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: msg.type === 'success' ? '#10b981' : '#f43f5e',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem',
          marginBottom: '1.25rem',
        }}>
          {msg.text}
        </div>
      )}

      {/* Profile Form */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.75rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.75rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-teal) 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                overflow: 'hidden',
              }}>
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <label style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'var(--accent-primary)',
                color: '#fff',
                padding: '0.35rem',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}>
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{user?.name}</h2>
              <p style={{ color: 'var(--accent-teal)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'capitalize' }}>
                Role: {user?.role}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Emergency Contact Section */}
          <div style={{ margin: '1.5rem 0', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem' }}>Emergency Contact</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Connor"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 987-6543"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            <Save size={18} />
            <span>{submitting ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>

      {/* Patient Caregiver Connections & Requests */}
      {isPatient && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
            Caregiver Authorizations & Invitations
          </h3>

          {relationships.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No caregivers have requested access to your medication schedule yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {relationships.map((rel) => {
                const caregiver = rel.caregiverId || {};
                return (
                  <div
                    key={rel._id}
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                        {caregiver.name || 'Caregiver'}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{caregiver.email}</p>
                      <span style={{ fontSize: '0.75rem', color: rel.status === 'accepted' ? '#10b981' : rel.status === 'pending' ? '#f59e0b' : '#f43f5e', fontWeight: 700 }}>
                        Status: {rel.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {rel.status === 'pending' && (
                        <button
                          onClick={() => handleRelationshipAction(rel._id, 'accepted')}
                          className="btn btn-success btn-sm"
                        >
                          <Check size={14} /> Accept Request
                        </button>
                      )}
                      {rel.status === 'accepted' && (
                        <button
                          onClick={() => handleRelationshipAction(rel._id, 'revoked')}
                          className="btn btn-danger btn-sm"
                        >
                          <X size={14} /> Revoke Access
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
