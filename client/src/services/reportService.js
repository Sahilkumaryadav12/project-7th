import api from './api';

export const getWeeklyReport = async () => {
  const res = await api.get('/reports/weekly');
  return res.data;
};

export const getMonthlyReport = async () => {
  const res = await api.get('/reports/monthly');
  return res.data;
};
