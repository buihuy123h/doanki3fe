import { apiClient } from './client.js';

export const vendorService = {
  // Lấy danh sách nhà cung cấp
  getVendors: (params) => {
    return apiClient.get('/api/admin/vendor', params);
  },

  // Lấy chi tiết NCC theo ID
  getVendorById: (id) => {
    return apiClient.get(`/api/admin/vendor/${id}`);
  },

  // Lấy thống kê NCC
  getVendorStats: () => {
    return apiClient.get('/api/admin/vendor/stats');
  },

  // Thêm nhà cung cấp mới
  createVendor: (data) => {
    return apiClient.post('/api/admin/vendor', data);
  },

  // Cập nhật nhà cung cấp
  updateVendor: (id, data) => {
    return apiClient.put(`/api/admin/vendor/${id}`, data);
  },

  // Xóa nhà cung cấp
  deleteVendor: (id) => {
    return apiClient.delete(`/api/admin/vendor/${id}`);
  },
};
