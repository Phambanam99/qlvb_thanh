import api from "./config";

export interface EquipmentDTO {
  id: number;
  name: string;
  category?: string;
  serialNumber?: string;
  status?: string;
  conditionLabel?: string;
  quantity?: number;
  purchaseDate?: string;
  lastMaintenanceDate?: string;
  notes?: string;
  departmentId?: number;
  departmentName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquipmentStatsDTO {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface LookupItem {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export const equipmentAPI = {
  list: async (
    params: { page?: number; size?: number; departmentId?: number } = {}
  ): Promise<Page<EquipmentDTO>> => {
    const res = await api.get("/equipment", { params });
    return res.data.data;
  },
  getById: async (id: number): Promise<EquipmentDTO> => {
    const res = await api.get(`/equipment/${id}`);
    return res.data.data;
  },
  create: async (payload: Partial<EquipmentDTO>): Promise<EquipmentDTO> => {
    console.log("duck", payload);
    const res = await api.post("/equipment", payload);
    return res.data.data;
  },
  update: async (
    id: number,
    payload: Partial<EquipmentDTO>
  ): Promise<EquipmentDTO> => {
    const res = await api.put(`/equipment/${id}`, payload);
    return res.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/equipment/${id}`);
  },
  stats: async (
    params: { departmentId?: number } = {}
  ): Promise<EquipmentStatsDTO> => {
    const res = await api.get("/equipment/statistics", { params });
    return res.data.data;
  },
  lookups: async (): Promise<{
    categories: LookupItem[];
    statuses: LookupItem[];
    conditions: LookupItem[];
  }> => {
    const res = await api.get("/equipment/lookups");
    return res.data.data;
  },
  initLookups: async (): Promise<void> => {
    await api.post("/equipment/lookups/initialize");
  },
  // Lookup CRUD helpers
  createCategory: async (payload: Omit<LookupItem, "id">) => {
    return (await api.post("/equipment/lookups/categories", payload)).data
      .data as LookupItem;
  },
  deleteCategory: async (id: number) => {
    await api.delete(`/equipment/lookups/categories/${id}`);
  },
  createStatus: async (payload: Omit<LookupItem, "id">) => {
    return (await api.post("/equipment/lookups/statuses", payload)).data
      .data as LookupItem;
  },
  deleteStatus: async (id: number) => {
    await api.delete(`/equipment/lookups/statuses/${id}`);
  },
  createCondition: async (payload: Omit<LookupItem, "id">) => {
    return (await api.post("/equipment/lookups/conditions", payload)).data
      .data as LookupItem;
  },
  deleteCondition: async (id: number) => {
    await api.delete(`/equipment/lookups/conditions/${id}`);
  },
};
