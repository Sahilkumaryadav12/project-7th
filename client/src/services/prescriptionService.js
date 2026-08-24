import api from './api';

export const getPrescriptions = async () => {
  const res = await api.get('/prescriptions');
  return res.data;
};

export const uploadPrescription = async (formData) => {
  const res = await api.post('/prescriptions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const deletePrescription = async (id) => {
  const res = await api.delete(`/prescriptions/${id}`);
  return res.data;
};
