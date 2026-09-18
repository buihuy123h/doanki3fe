import { apiClient } from '../client.js';

/**
 * Admin Vendor API - Kết nối trực tiếp Controller: VendorController.cs
 * URL Base: /api/admin/vendor
 */
export const vendorApi = {
  // 1. Lấy danh sách nhà cung cấp (Tab Vendor Management)
  displayVendor: (params) => {
    return apiClient.get('/api/admin/vendor/displayVendor', params);
  },

  // Alias ngắn gọn
  getAll: (params) => {
    return apiClient.get('/api/admin/vendor', params);
  },

  // 2. Lấy chi tiết một nhà cung cấp
  getById: (id) => {
    return apiClient.get(`/api/admin/vendor/${id}`);
  },

  // 3. Thống kê nhà cung cấp
  getStats: () => {
    return apiClient.get('/api/admin/vendor/stats');
  },

  // 4. Thêm nhà cung cấp mới
  create: (data) => {
    return apiClient.post('/api/admin/vendor', data);
  },

  // 5. Cập nhật thông tin nhà cung cấp
  update: (id, data) => {
    return apiClient.put(`/api/admin/vendor/${id}`, data);
  },

  // 6. Xóa nhà cung cấp
  delete: (id) => {
    return apiClient.delete(`/api/admin/vendor/${id}`);
  },

  // Alias tương thích ngược
  getVendors: (params) => apiClient.get('/api/admin/vendor', params),
  getVendorById: (id) => apiClient.get(`/api/admin/vendor/${id}`),
  getVendorStats: () => apiClient.get('/api/admin/vendor/stats'),
  createVendor: (data) => apiClient.post('/api/admin/vendor', data),
  updateVendor: (id, data) => apiClient.put(`/api/admin/vendor/${id}`, data),
  deleteVendor: (id) => apiClient.delete(`/api/admin/vendor/${id}`),
};
