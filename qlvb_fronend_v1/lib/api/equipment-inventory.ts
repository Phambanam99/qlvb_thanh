import api from "./config";

export interface WeaponInventoryRow {
  id: string | number;
  name: string;
  origin?: string; // Nước sản xuất
  unit: string; // ĐVT
  grade?: string; // Phân cấp
  quantity: number;
  distribution: { total: number; tm: number; d1: number; d2: number; d3: number; khoLu: number };
  note?: string;
}

export interface AmmunitionInventoryRow {
  id: string | number;
  name: string;
  unit: string; // Đơn vị tính
  grade?: string; // Phân cấp
  quantity: number;
  weightTon?: number; // Khối lượng (tấn)
  distribution: { tm: number; d1: number; d2: number; d3: number; khoLu: number; khoK820?: number };
}

export interface VehicleInventoryRow {
  id: string | number;
  registration: string; // Số đăng ký
  makeModel: string; // Nhãn xe cơ sở
  chassisNo?: string; // Số khung
  engineNo?: string; // Số máy
  manufactureYear?: number; // Năm s.xuất
  startUseYear?: number; // Năm b.s. dụng
  origin?: string; // Nguồn gốc
  stationedAt?: string; // B.chế ở (e,f,lữ,.)
  qualityGrade?: string; // Phân cấp CL
  status?: string; // Trạng thái SD
}

export interface EngineeringVehicleRow extends VehicleInventoryRow {}

export interface PowerStationRow {
  id: string | number;
  name: string; // Tên trạm nguồn
  fuel: string; // Nhiên liệu SD
  stationCode?: string; // Số hiệu trạm
  manufactureYear?: number; // Năm sản xuất
  startUseYear?: number; // Năm BĐ SD
  qualityLevel?: number | string; // Cấp CL
  purpose?: string; // M/đích SD
  status?: string; // T/thái SD
  unitName?: string; // Đơn vị
}

export const equipmentInventoryAPI = {
  async getWeapons(query?: string): Promise<WeaponInventoryRow[]> {
    const res = await api.get("/equipment-inventory/weapons", { params: { q: query } });
    return res.data.data as WeaponInventoryRow[];
  },

  async getAmmunitions(query?: string): Promise<AmmunitionInventoryRow[]> {
    const res = await api.get("/equipment-inventory/ammunitions", { params: { q: query } });
    return res.data.data as AmmunitionInventoryRow[];
  },

  async getVehicles(query?: string): Promise<VehicleInventoryRow[]> {
    const res = await api.get("/equipment-inventory/vehicles", { params: { q: query } });
    return res.data.data as VehicleInventoryRow[];
  },

  async getEngineeringVehicles(query?: string): Promise<EngineeringVehicleRow[]> {
    const res = await api.get("/equipment-inventory/engineering-vehicles", { params: { q: query } });
    return res.data.data as EngineeringVehicleRow[];
  },

  async getPowerStations(query?: string): Promise<PowerStationRow[]> {
    const res = await api.get("/equipment-inventory/power-stations", { params: { q: query } });
    return res.data.data as PowerStationRow[];
  },

  // Update helpers (mock persistence in memory)
  async updateWeapon(updated: WeaponInventoryRow): Promise<WeaponInventoryRow> {
    const res = await api.put(`/equipment-inventory/weapons/${updated.id}`, updated);
    return res.data.data as WeaponInventoryRow;
  },
  async updateAmmunition(updated: AmmunitionInventoryRow): Promise<AmmunitionInventoryRow> {
    const res = await api.put(`/equipment-inventory/ammunitions/${updated.id}`, updated);
    return res.data.data as AmmunitionInventoryRow;
  },
  async updateVehicle(updated: VehicleInventoryRow): Promise<VehicleInventoryRow> {
    const res = await api.put(`/equipment-inventory/vehicles/${updated.id}`, updated);
    return res.data.data as VehicleInventoryRow;
  },
  async updateEngineeringVehicle(updated: EngineeringVehicleRow): Promise<EngineeringVehicleRow> {
    const res = await api.put(`/equipment-inventory/engineering-vehicles/${updated.id}`, updated);
    return res.data.data as EngineeringVehicleRow;
  },
  async updatePowerStation(updated: PowerStationRow): Promise<PowerStationRow> {
    const res = await api.put(`/equipment-inventory/power-stations/${updated.id}`, updated);
    return res.data.data as PowerStationRow;
  },
};


