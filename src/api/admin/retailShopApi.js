import { apiClient } from '../client.js';

/**
 * Admin Retail Shop API - Kết nối trực tiếp Controller: RetailShopController.cs
 * URL Base: /api/admin/retailshop hoặc /api/admin/retailstore
 */
export const retailShopApi = {
  // 1. Lấy danh sách chi nhánh cửa hàng (Tab Retail Shops)
  displayRetailShops: (params) => {
    return apiClient.get('/api/admin/retailshop/displayRetailShops', params);
  },

  // Alias ngắn gọn
  getAll: (params) => {
    return apiClient.get('/api/admin/retailshop', params);
  },

  // 2. Lấy chi tiết một cửa hàng chi nhánh
  getById: (id) => {
    return apiClient.get(`/api/admin/retailshop/${id}`);
  },

  // 3. Thống kê toàn bộ chuỗi điểm bán lẻ
  getStats: () => {
    return apiClient.get('/api/admin/retailshop/stats');
  },

  // 4. Thêm chi nhánh mới
  create: (data) => {
    return apiClient.post('/api/admin/retailshop', data);
  },

  // 5. Cập nhật thông tin chi nhánh
  update: (id, data) => {
    return apiClient.put(`/api/admin/retailshop/${id}`, data);
  },

  // 6. Xóa chi nhánh
  delete: (id) => {
    return apiClient.delete(`/api/admin/retailshop/${id}`);
  },
};
