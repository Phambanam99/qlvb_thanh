import api from "./config";
import { PageResponse } from "./types";

export interface UserDTO {
  id?: number;
  username: string;
  fullName: string;
  position?: string;
  departmentId?: number;
  departmentName?: string;
  isActive?: boolean;
  statusDisplayName?: string;
  email?: string;
  phone?: string;
  roles: string[];
  roleId: number;
  createdAt: string;
  updatedAt: string;
  roleDisplayNames?: string[];
  status?: number;
  isCommanderOfUnit?: boolean;
}

export const usersAPI = {
  /**
   * Get all users
   * @returns List of all users
   */
  getAllUsers: async (params?: any): Promise<UserDTO[]> => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  /**
   * Get paginated users with filtering
   * @param params Object containing pagination and filter parameters
   * @returns Paginated response with user data
   */
  getPaginatedUsers: async (params?: any): Promise<PageResponse<UserDTO>> => {
    const response = await api.get("/users/paginated", { params });
    return response.data;
  },

  //get users by Department Id
  getUsersByDepartmentId: async (departmentId: number): Promise<UserDTO[]> => {
    const response = await api.get(`/users/department/${departmentId}`);
    // console.log("response", response.data);
    return response.data;
  },
  /**
   * Get user by ID
   * @param id User ID
   * @returns User data
   */
  getUserById: async (id: string | number): Promise<UserDTO> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   * @param userData User data
   * @returns Created user data
   */
  createUser: async (userData: Partial<UserDTO>): Promise<UserDTO> => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  /**
   * Update user
   * @param id User ID
   * @param userData User data to update
   * @returns Updated user data
   */
  updateUser: async (
    id: string | number,
    userData: Partial<UserDTO>
  ): Promise<UserDTO> => {
    const response = await api.put(`/users/${id}/update`, userData);
    return response.data;
  },

  /**
   * Delete user
   * @param id User ID
   * @returns Success message
   */
  deleteUser: async (id: string | number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  /**
   * Change user password
   * @param id User ID
   * @param oldPassword Old password
   * @param newPassword New password
   * @returns Success message
   */
  changePassword: async (
    id: string | number,
    oldPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const response = await api.put(`/users/${id}/password`, {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Check if the provided password matches the user's current password
   * @param id User ID
   * @param password Password to check
   * @returns Object with validity status
   */
  checkCurrentPassword: async (
    id: string | number,
    password: string
  ): Promise<{ valid: boolean }> => {
    const response = await api.post(`/users/${id}/check-password`, {
      password,
    });
    return response.data.data;
  },

  // Thêm phương thức mới để tương thích với code hiện tại
  resetPassword: async (
    id: string | number,
    newPassword: string
  ): Promise<{ message: string }> => {
    const response = await api.put(`/users/${id}/password`, {
      newPassword,
    });
    return response.data;
  },
  getUsersByRoleAndDepartment: async (
    roles: string[],
    departmentId: number
  ): Promise<UserDTO[]> => {
    const response = await api.get(`/users/department/${departmentId}/roles`, {
      params: { roles },
      paramsSerializer: {
        indexes: null, // <- điểm mấu chốt: bỏ [] khi serialize array
      },
    });
    return response.data.data;
  },

  // approve user
  approveUser: async (id: number): Promise<UserDTO> => {
    const response = await api.post(`/users/${id}/approve`);
    return response.data;
  },

  // reject user
  rejectUser: async (id: number): Promise<UserDTO> => {
    const response = await api.post(`/users/${id}/reject`);
    return response.data;
  },

  getUserForApproval: async (id: string | number): Promise<UserDTO[]> => {
    const response = await api.get(`/users/${id}/for-approval`);
    return response.data;
  },

  /**
   * Update current user's profile
   * @param id User ID
   * @param userData User data to update
   * @returns Updated user data
   */
  updateProfile: async (
    id: string | number,
    userData: Partial<UserDTO>
  ): Promise<UserDTO> => {
    const response = await api.put(`/users/${id}/update`, userData);
    return response.data.data; // Handle ResponseDTO wrapper
  },
};
