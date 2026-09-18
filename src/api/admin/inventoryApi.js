import { apiClient } from '../client.js';

/**
 * Admin Inventory API - Kết nối trực tiếp Controller: InventoryController.cs
 * URL Base: /api/admin/inventory
 */
export const inventoryApi = {
  // 1. Lấy danh sách thiết bị / vật tư kho (Tab Inventory)
  displayInventory: (params) => {
    return apiClient.get('/api/admin/inventory/displayInventory', params);
  },

  // Alias ngắn gọn
  getAll: (params) => {
    return apiClient.get('/api/admin/inventory', params);
  },

  // 2. Lấy danh sách vật tư sắp hết hàng
  getLowStock: () => {
    return apiClient.get('/api/admin/inventory/low-stock');
  },

  // 3. Lấy tổng quan tồn kho
  getOverview: () => {
    return apiClient.get('/api/admin/inventory/overview');
  },

  // 4. Lấy thống kê kho
  getStats: () => {
    return apiClient.get('/api/admin/inventory/stats');
  },

  // 5. Lấy chi tiết một vật tư
  getById: (id) => {
    return apiClient.get(`/api/admin/inventory/${id}`);
  },

  // 6. Thêm vật tư mới
  create: (data) => {
    return apiClient.post('/api/admin/inventory', data);
  },

  // 7. Cập nhật vật tư
  update: (id, data) => {
    return apiClient.put(`/api/admin/inventory/${id}`, data);
  },

  // 8. Cập nhật số lượng tồn kho
  updateStock: (id, quantity) => {
    return apiClient.patch(`/api/admin/inventory/${id}/stock`, { quantity });
  },

  // 9. Xóa vật tư khỏi kho
  delete: (id) => {
    return apiClient.delete(`/api/admin/inventory/${id}`);
  },

  // Alias tương thích ngược
  getInventory: (params) => apiClient.get('/api/admin/inventory', params),
  getLowStockItems: () => apiClient.get('/api/admin/inventory/low-stock'),
  getInventoryItemById: (id) => apiClient.get(`/api/admin/inventory/${id}`),
  getInventoryStats: () => apiClient.get('/api/admin/inventory/stats'),
  createInventoryItem: (data) => apiClient.post('/api/admin/inventory', data),
  updateInventoryItem: (id, data) => apiClient.put(`/api/admin/inventory/${id}`, data),
  updateStockQuantity: (id, quantity) => apiClient.patch(`/api/admin/inventory/${id}/stock`, { quantity }),
  deleteInventoryItem: (id) => apiClient.delete(`/api/admin/inventory/${id}`),
};
