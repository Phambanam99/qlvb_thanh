import api from "./config"

export interface PermissionDTO {
  id: number
  name: string
  description: string
  category: string
  systemPermission: boolean
}

export const permissionsAPI = {
  /**
   * Get all permissions
   * @returns List of all permissions
   */
  getAllPermissions: async (): Promise<PermissionDTO[]> => {
    const response = await api.get("/permissions")
    return response.data
  },

  /**
   * Get permission by ID
   * @param id Permission ID
   * @returns Permission data
   */
  getPermissionById: async (id: string | number): Promise<PermissionDTO> => {
    const response = await api.get(`/permissions/${id}`)
    return response.data
  },

  /**
   * Create new permission
   * @param permissionData Permission data
   * @returns Created permission data
   */
  createPermission: async (permissionData: Partial<PermissionDTO>) => {
    const response = await api.post("/permissions", permissionData)
    return response.data
  },

  /**
   * Update permission
   * @param id Permission ID
   * @param permissionData Permission data to update
   * @returns Updated permission data
   */
  updatePermission: async (id: string | number, permissionData: Partial<PermissionDTO>) => {
    const response = await api.put(`/permissions/${id}`, permissionData)
    return response.data
  },

  /**
   * Delete permission
   * @param id Permission ID
   * @returns Success message
   */
  deletePermission: async (id: string | number) => {
    const response = await api.delete(`/permissions/${id}`)
    return response.data
  },

  /**
   * Get system permissions
   * @returns List of system permissions
   */
  getSystemPermissions: async (): Promise<PermissionDTO[]> => {
    const response = await api.get("/permissions/system")
    return response.data
  },

  /**
   * Get custom permissions
   * @returns List of custom permissions
   */
  getCustomPermissions: async (): Promise<PermissionDTO[]> => {
    const response = await api.get("/permissions/custom")
    return response.data
  },

  /**
   * Get permissions by category
   * @param category Category to filter by
   * @returns List of permissions in the specified category
   */
  getPermissionsByCategory: async (category: string): Promise<PermissionDTO[]> => {
    const response = await api.get(`/permissions/category/${category}`)
    return response.data
  },
}
