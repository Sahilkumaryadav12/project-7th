import api from './api';

export const updateProfile = async (formData) => {
  const res = await api.put('/users/me', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
