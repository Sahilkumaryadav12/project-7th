import api from './api';

export const getMedicationLogs = async (params = {}) => {
  const res = await api.get('/medication-logs', { params });
  return res.data;
};

export const createOrUpsertLog = async (data) => {
  const res = await api.post('/medication-logs', data);
  return res.data;
};

export const updateLogStatus = async (id, statusData) => {
  const res = await api.put(`/medication-logs/${id}`, statusData);
  return res.data;
};
