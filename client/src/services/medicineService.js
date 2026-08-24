import api from './api';

export const getMedicines = async () => {
  const res = await api.get('/medicines');
  return res.data;
};

export const getMedicineById = async (id) => {
  const res = await api.get(`/medicines/${id}`);
  return res.data;
};

export const createMedicine = async (data) => {
  const res = await api.post('/medicines', data);
  return res.data;
};

export const updateMedicine = async (id, data) => {
  const res = await api.put(`/medicines/${id}`, data);
  return res.data;
};

export const deleteMedicine = async (id) => {
  const res = await api.delete(`/medicines/${id}`);
  return res.data;
};
