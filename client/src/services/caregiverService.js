import api from './api';

export const getAssignedPatients = async () => {
  const res = await api.get('/caregiver/patients');
  return res.data;
};

export const getPatientDetail = async (patientId) => {
  const res = await api.get(`/caregiver/patients/${patientId}`);
  return res.data;
};

export const invitePatient = async (patientEmail) => {
  const res = await api.post('/caregiver/invite', { patientEmail });
  return res.data;
};

export const getPatientRelationships = async () => {
  const res = await api.get('/caregiver/patient-relationships');
  return res.data;
};

export const updateRelationshipStatus = async (id, status) => {
  const res = await api.put(`/caregiver/relationships/${id}`, { status });
  return res.data;
};
