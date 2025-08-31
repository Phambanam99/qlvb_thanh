import api from "./config";
import type { PermissionDTO, PageResponse } from "./types";

export interface CustomRoleDTO {
  id: number;
  name: string;
  displayName?: string;
  description: string;
  isSystem: boolean;
  systemRole: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: number;
  createdByName?: string;
  permissions?: PermissionDTO[] | string[];
  userCount?: number;
}

export interface RoleDTO {
  id: number;
  name?: string;
  displayName?: string;
  description?: string;
  userCount?: number;
  isSystem?: boolean;
}

export interface CreateRoleDTO {
  name: string;
  displayName: string;
  description: string;
  permissions?: string[];
}

export interface UpdateRoleDTO {
  name?: string;
  displayName?: string;
  description?: string;
  permissions?: string[];
}

export const rolesAPI = {
  /**
   * Get all roles
   * @returns List of all roles
   */
  getAllRoles: async (): Promise<RoleDTO[]> => {
    try {
      const response = await api.get("/roles");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get roles with pagination
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of roles
   */
  getRolesPaginated: async (
    page = 0,
    size = 10
  ): Promise<PageResponse<RoleDTO>> => {
    try {
      const response = await api.get("/roles/paginated", {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get role by ID
   * @param id Role ID
   * @returns Role data
   */
  getRoleById: async (id: string | number): Promise<RoleDTO> => {
    try {
      const response = await api.get(`/roles/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get role by name
   * @param name Role name
   * @returns Role data
   */
  getRoleByName: async (name: string): Promise<RoleDTO> => {
    try {
      const response = await api.get(`/roles/name/${name}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create new role
   * @param roleData Role data
   * @returns Created role data
   */
  createRole: async (roleData: CreateRoleDTO): Promise<RoleDTO> => {
    try {
      const response = await api.post("/roles", roleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update role
   * @param id Role ID
   * @param roleData Role data to update
   * @returns Updated role data
   */
  updateRole: async (
    id: string | number,
    roleData: UpdateRoleDTO
  ): Promise<RoleDTO> => {
    try {
      const response = await api.put(`/roles/${id}`, roleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete role
   * @param id Role ID
   * @returns Success message
   */
  deleteRole: async (id: string | number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/roles/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

 

 
};
