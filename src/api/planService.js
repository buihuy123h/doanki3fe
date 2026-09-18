import { apiClient } from './client.js';

export const planService = {
  // Lấy toàn bộ danh sách gói cước (có tìm kiếm & lọc)
  getPlans: (params) => {
    return apiClient.get('/api/admin/plan', params);
  },

  // Lấy chi tiết một gói cước theo ID hoặc PlanCode
  getPlanById: (id) => {
    return apiClient.get(`/api/admin/plan/${id}`);
  },

  // Lấy danh sách gói Landline (điện thoại cố định)
  getLandlinePlans: (search) => {
    return apiClient.get('/api/admin/plan/landline', { search });
  },

  // Lấy danh sách gói Broadband (cáp quang)
  getBroadbandPlans: (search) => {
    return apiClient.get('/api/admin/plan/broadband', { search });
  },

  // Lấy danh sách gói Dial-Up (quay số)
  getDialUpPlans: (search) => {
    return apiClient.get('/api/admin/plan/dial-up', { search });
  },

  // Lấy thống kê số lượng các loại gói cước
  getPlanStats: () => {
    return apiClient.get('/api/admin/plan/stats');
  },

  // Thêm gói cước mới
  createPlan: (data) => {
    return apiClient.post('/api/admin/plan', data);
  },

  // Cập nhật gói cước
  updatePlan: (id, data) => {
    return apiClient.put(`/api/admin/plan/${id}`, data);
  },

  // Xóa gói cước
  deletePlan: (id) => {
    return apiClient.delete(`/api/admin/plan/${id}`);
  },
};
