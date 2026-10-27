import api, { getFileUrl } from './api';

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

export const addPrescriptionMedicinesToTracker = async (prescriptionId, medicines) => {
  const res = await api.post('/medicines/bulk', { prescriptionId, medicines });
  return res.data;
};

export const viewPrescriptionFile = async (prescriptionId, fileType = 'pdf') => {
  const token = localStorage.getItem('meditrack_token');
  try {
    const res = await api.get(`/prescriptions/${prescriptionId}/file`, {
      responseType: 'blob',
    });
    const mimeTypes = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    const blobType = res.headers['content-type'] || mimeTypes[fileType] || 'application/octet-stream';
    const blob = new Blob([res.data], { type: blobType });
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 120000);
  } catch (err) {
    console.warn('[Prescription] Blob view failed, using direct URL fallback', err);
    const directUrl = getFileUrl(`/api/prescriptions/${prescriptionId}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`);
    window.open(directUrl, '_blank');
  }
};
