import api from "./config";
import type { PageResponse, ResponseDTO } from "./types";

export interface DepartmentDTO {
  id: number;
  name: string;
  abbreviation: string;
  email?: string;
  type:
    | "ADMINISTRATIVE"
    | "PROFESSIONAL"
    | "SUPPORT"
    | "SUBSIDIARY"
    | "LEADERSHIP";
  externalId?: string;
  codeDepartment?: string;
  group?: string;
  userCount?: number;
  assignedDocumentsCount?: number;
  parentDepartmentId?: number;
  parentDepartmentName?: string;
  childDepartments: any[];
  storageLocation?: string;
  typeName?: string;
  typeCode?: number;
}

export const departmentsAPI = {
  /**
   * Get all departments
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of departments
   */
  getAllDepartments: async (
    page = 0,
    size = 100
  ): Promise<ResponseDTO<PageResponse<DepartmentDTO>>> => {
    const response = await api.get("/departments", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Get department by ID
   * @param id Department ID
   * @returns Department data
   */
  getDepartmentById: async (id: string | number): Promise<ResponseDTO<DepartmentDTO>> => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  /**
   * Create new department
   * @param departmentData Department data
   * @returns Created department data
   */
  createDepartment: async (departmentData: Partial<DepartmentDTO>) => {
    const response = await api.post("/departments", departmentData);
    return response.data;
  },

  /**
   * Update department
   * @param id Department ID
   * @param departmentData Department data to update
   * @returns Updated department data
   */
  updateDepartment: async (
    id: string | number,
    departmentData: Partial<DepartmentDTO>
  ) => {
    const response = await api.put(`/departments/${id}`, departmentData);
    return response.data;
  },

  /**
   * Delete department
   * @param id Department ID
   * @returns Success message
   */
  deleteDepartment: async (id: string | number) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  /**
   * Get child departments for a parent department
   * @param id Parent department ID
   * @returns List of child departments
   */
  getChildDepartments: async (
    id: string | number
  ): Promise<ResponseDTO<DepartmentDTO>> => {
    const response = await api.get(`/departments/${id}`);
    return response.data || [];
  },

  /**
   * Get department types
   * @returns List of department types
   */
  getDepartmentTypes: async () => {
    const response = await api.get("/departments/types");
    return response.data;
  },

  /**
   * Search departments
   * @param keyword Keyword to search for
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of matching departments
   */
  searchDepartments: async (keyword: string, page = 0, size = 10) => {
    const response = await api.get("/departments/search", {
      params: { keyword, page, size },
    });
    return response.data;
  },
};
