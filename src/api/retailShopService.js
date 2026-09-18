import { apiClient } from './client.js';

export const retailShopService = {
  // Lấy danh sách chi nhánh cửa hàng
  getRetailShops: (params) => {
    return apiClient.get('/api/admin/retailshop', params);
  },

  // Lấy chi tiết chi nhánh theo ID
  getRetailShopById: (id) => {
    return apiClient.get(`/api/admin/retailshop/${id}`);
  },

  // Lấy thống kê chuỗi cửa hàng
  getRetailShopStats: () => {
    return apiClient.get('/api/admin/retailshop/stats');
  },

  // Thêm chi nhánh mới
  createRetailShop: (data) => {
    return apiClient.post('/api/admin/retailshop', data);
  },

  // Cập nhật chi nhánh
  updateRetailShop: (id, data) => {
    return apiClient.put(`/api/admin/retailshop/${id}`, data);
  },

  // Xóa chi nhánh
  deleteRetailShop: (id) => {
    return apiClient.delete(`/api/admin/retailshop/${id}`);
  },
};
