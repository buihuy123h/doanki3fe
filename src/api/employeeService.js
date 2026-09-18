import { apiClient } from './client.js';

export const employeeService = {
  // Lấy danh sách nhân viên (hỗ trợ tìm kiếm & lọc)
  getEmployees: (params) => {
    return apiClient.get('/api/admin/employee', params);
  },

  // Lấy chi tiết nhân viên theo ID hoặc mã NV
  getEmployeeById: (id) => {
    return apiClient.get(`/api/admin/employee/${id}`);
  },

  // Tạo nhân viên mới
  createEmployee: (data) => {
    return apiClient.post('/api/admin/employee', data);
  },

  // Cập nhật nhân viên
  updateEmployee: (id, data) => {
    return apiClient.put(`/api/admin/employee/${id}`, data);
  },

  // Xóa nhân viên
  deleteEmployee: (id) => {
    return apiClient.delete(`/api/admin/employee/${id}`);
  },
};
