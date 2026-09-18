import { apiClient } from '../client.js';

/**
 * Admin Employee API - Kết nối trực tiếp Controller: EmployeeController.cs
 * URL Base: /api/admin/employee
 */
export const employeeApi = {
  // 1. Lấy danh sách nhân viên (Tab Employee Management)
  displayEmployee: (params) => {
    return apiClient.get('/api/admin/employee/displayEmployee', params);
  },

  // Alias ngắn gọn
  getAll: (params) => {
    return apiClient.get('/api/admin/employee', params);
  },

  // 2. Tìm kiếm nhân viên
  search: (keyword) => {
    return apiClient.get('/api/admin/employee/search', { search: keyword });
  },

  // 3. Lọc nhân viên theo phòng ban, vai trò, trạng thái
  filter: (params) => {
    return apiClient.get('/api/admin/employee/filter', params);
  },

  // 4. Lấy chi tiết một nhân viên
  getById: (id) => {
    return apiClient.get(`/api/admin/employee/${id}`);
  },

  // 5. Thêm nhân viên mới
  create: (data) => {
    return apiClient.post('/api/admin/employee', data);
  },

  // 6. Cập nhật nhân viên
  update: (id, data) => {
    return apiClient.put(`/api/admin/employee/${id}`, data);
  },

  // 7. Xóa nhân viên
  delete: (id) => {
    return apiClient.delete(`/api/admin/employee/${id}`);
  },
};
