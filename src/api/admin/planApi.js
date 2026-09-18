import { apiClient } from '../client.js';

/**
 * Admin Plan API - Kết nối trực tiếp Controller: PlanController.cs
 * URL Base: /api/admin/plan hoặc /api/admin/serviceplan
 */
export const planApi = {
  // 1. Lấy toàn bộ danh sách gói cước (Tab Plan Management)
  displayPlans: (params) => {
    return apiClient.get('/api/admin/plan/displayPlans', params);
  },

  // Alias ngắn gọn
  getAll: (params) => {
    return apiClient.get('/api/admin/plan', params);
  },

  // 2. Lấy chi tiết một gói cước theo ID hoặc PlanCode
  getById: (id) => {
    return apiClient.get(`/api/admin/plan/${id}`);
  },

  // 3. Lấy riêng danh sách gói cước Landline (Điện thoại cố định)
  getLandline: (search) => {
    return apiClient.get('/api/admin/plan/landline', { search });
  },

  // 4. Lấy riêng danh sách gói cước Broadband (Cáp quang băng rộng)
  getBroadband: (search) => {
    return apiClient.get('/api/admin/plan/broadband', { search });
  },

  // 5. Lấy riêng danh sách gói cước Dial-Up (Quay số)
  getDialUp: (search) => {
    return apiClient.get('/api/admin/plan/dial-up', { search });
  },

  // 6. Thống kê số lượng gói cước theo từng nhóm kết nối
  getStats: () => {
    return apiClient.get('/api/admin/plan/stats');
  },

  // 7. Tạo mới gói cước
  create: (data) => {
    return apiClient.post('/api/admin/plan', data);
  },

  // 8. Cập nhật gói cước
  update: (id, data) => {
    return apiClient.put(`/api/admin/plan/${id}`, data);
  },

  // 9. Xóa gói cước
  delete: (id) => {
    return apiClient.delete(`/api/admin/plan/${id}`);
  },

  // Alias tương thích ngược
  getPlans: (params) => apiClient.get('/api/admin/plan', params),
  getPlanById: (id) => apiClient.get(`/api/admin/plan/${id}`),
  getLandlinePlans: (search) => apiClient.get('/api/admin/plan/landline', { search }),
  getBroadbandPlans: (search) => apiClient.get('/api/admin/plan/broadband', { search }),
  getDialUpPlans: (search) => apiClient.get('/api/admin/plan/dial-up', { search }),
  getPlanStats: () => apiClient.get('/api/admin/plan/stats'),
  createPlan: (data) => apiClient.post('/api/admin/plan', data),
  updatePlan: (id, data) => apiClient.put(`/api/admin/plan/${id}`, data),
  deletePlan: (id) => apiClient.delete(`/api/admin/plan/${id}`),
};
