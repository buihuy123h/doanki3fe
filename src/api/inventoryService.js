import { apiClient } from './client.js';

export const inventoryService = {
  // Lấy danh sách vật tư kho
  getInventory: (params) => {
    return apiClient.get('/api/admin/inventory', params);
  },

  // Lấy danh sách vật tư sắp hết hàng (dưới ngưỡng cảnh báo)
  getLowStockItems: () => {
    return apiClient.get('/api/admin/inventory/low-stock');
  },

  // Lấy chi tiết vật tư theo ID
  getInventoryItemById: (id) => {
    return apiClient.get(`/api/admin/inventory/${id}`);
  },

  // Lấy thống kê tồn kho
  getInventoryStats: () => {
    return apiClient.get('/api/admin/inventory/stats');
  },

  // Thêm vật tư mới vào kho
  createInventoryItem: (data) => {
    return apiClient.post('/api/admin/inventory', data);
  },

  // Cập nhật thông tin vật tư
  updateInventoryItem: (id, data) => {
    return apiClient.put(`/api/admin/inventory/${id}`, data);
  },

  // Cập nhật số lượng tồn kho (nhập/xuất)
  updateStockQuantity: (id, quantity) => {
    return apiClient.patch(`/api/admin/inventory/${id}/stock`, { quantity });
  },

  // Xóa vật tư
  deleteInventoryItem: (id) => {
    return apiClient.delete(`/api/admin/inventory/${id}`);
  },
};
