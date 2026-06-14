import api from './api';

const doraService = {
  saveDora: async (doraData) => (await api.post('/api/dora', doraData)).data,
  getAllDora: async () => (await api.get('/api/dora')).data,
  getDoraSummary: async () => (await api.get('/api/dora/summary')).data,

  // Live metrics
  getMyMetrics: async () => (await api.get('/api/dora/metrics/me')).data,
  getDepartmentMetrics: async () => (await api.get('/api/dora/metrics/department')).data,
  getUserMetrics: async (userId) => (await api.get(`/api/dora/metrics/user/${userId}`)).data,
};

export default doraService;
