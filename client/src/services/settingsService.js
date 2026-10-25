import api from './api';

export const getSettings = async () => (await api.get('/settings')).data;
export const updateSettings = async (data) => (await api.put('/settings', data)).data;
