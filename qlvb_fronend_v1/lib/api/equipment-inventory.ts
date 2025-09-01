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

// In-memory mocks (replace with backend later)
const mockWeapons: WeaponInventoryRow[] = [
  { id: 1, name: "Súng ngắn 7,62mm K54", origin: "LX", unit: "Khẩu", grade: "+", quantity: 57, distribution: { total: 57, tm: 9, d1: 0, d2: 0, d3: 12, khoLu: 36 } },
  { id: 2, name: "Súng ngắn 9mm K59", origin: "LX", unit: "Khẩu", grade: "+", quantity: 5, distribution: { total: 5, tm: 2, d1: 0, d2: 0, d3: 0, khoLu: 3 } },
];

const mockAmmunitions: AmmunitionInventoryRow[] = [
  { id: 1, name: "Đạn 7,62mm K51", unit: "Viên", grade: "2", quantity: 4486, weightTon: 0.063, distribution: { tm: 216, d1: 0, d2: 0, d3: 288, khoLu: 3982, khoK820: 0 } },
  { id: 2, name: "Đạn 7,62mm K56", unit: "Viên", grade: "2", quantity: 52290, weightTon: 1.150, distribution: { tm: 4620, d1: 700, d2: 2760, d3: 5450, khoLu: 38760, khoK820: 0 } },
];

const mockVehicles: VehicleInventoryRow[] = [
  { id: 1, registration: "BC-20-84", makeModel: "UAZ-469", chassisNo: "476191", engineNo: "2057357", manufactureYear: 1995, startUseYear: 1995, origin: "TBQP", stationedAt: "HC-KT", qualityGrade: "C3", status: "SDTX" },
  { id: 2, registration: "BC-40-16", makeModel: "UAZ-31512", chassisNo: "3929", engineNo: "1105466", manufactureYear: 2002, startUseYear: 2004, origin: "TBQP", stationedAt: "HC-KT", qualityGrade: "C2", status: "SDTX" },
];

const mockEngineering: EngineeringVehicleRow[] = [
  { id: 1, registration: "CB-01-01", makeModel: "UAZ-469", chassisNo: "476191", engineNo: "2057357", manufactureYear: 1995, startUseYear: 1995, origin: "TBQP", stationedAt: "HC-KT", qualityGrade: "C3", status: "SDTX" },
  { id: 2, registration: "CB-02-16", makeModel: "UAZ-31512", chassisNo: "3929", engineNo: "1105466", manufactureYear: 2002, startUseYear: 2004, origin: "TBQP", stationedAt: "HC-KT", qualityGrade: "C2", status: "SDTX" },
];

const mockPowerStations: PowerStationRow[] = [
  { id: 1, name: "Phát điện CUMINS-0NAN", fuel: "DIESEL", stationCode: "Đ-191", manufactureYear: 1998, startUseYear: 2000, qualityLevel: 4, purpose: "XDCT", status: "TX", unitName: "HC-KT" },
  { id: 2, name: "Phát điện ESD-50/VS400", fuel: "DIESEL", stationCode: "Đ-166", manufactureYear: 1985, startUseYear: 1985, qualityLevel: 2, purpose: "TC", status: "NCNH", unitName: "HC-KT" },
];

export const equipmentInventoryAPI = {
  async getWeapons(query?: string): Promise<WeaponInventoryRow[]> {
    const q = (query || "").toLowerCase();
    return mockWeapons.filter((w) =>
      [w.name, w.origin, w.unit, w.grade].some((v) => (v || "").toLowerCase().includes(q))
    );
  },

  async getAmmunitions(query?: string): Promise<AmmunitionInventoryRow[]> {
    const q = (query || "").toLowerCase();
    return mockAmmunitions.filter((a) =>
      [a.name, a.unit, a.grade].some((v) => (v || "").toLowerCase().includes(q))
    );
  },

  async getVehicles(query?: string): Promise<VehicleInventoryRow[]> {
    const q = (query || "").toLowerCase();
    return mockVehicles.filter((v) =>
      [v.registration, v.makeModel, v.stationedAt, v.qualityGrade, v.status].some((x) => (x || "").toLowerCase().includes(q))
    );
  },

  async getEngineeringVehicles(query?: string): Promise<EngineeringVehicleRow[]> {
    const q = (query || "").toLowerCase();
    return mockEngineering.filter((v) =>
      [v.registration, v.makeModel, v.stationedAt, v.qualityGrade, v.status].some((x) => (x || "").toLowerCase().includes(q))
    );
  },

  async getPowerStations(query?: string): Promise<PowerStationRow[]> {
    const q = (query || "").toLowerCase();
    return mockPowerStations.filter((p) =>
      [p.name, p.fuel, String(p.qualityLevel), p.purpose, p.status, p.unitName].some((x) => (x || "").toLowerCase().includes(q))
    );
  },

  // Update helpers (mock persistence in memory)
  async updateWeapon(updated: WeaponInventoryRow): Promise<WeaponInventoryRow> {
    const idx = mockWeapons.findIndex((x) => x.id === updated.id);
    if (idx >= 0) mockWeapons[idx] = { ...mockWeapons[idx], ...updated };
    return mockWeapons[idx];
  },
  async updateAmmunition(updated: AmmunitionInventoryRow): Promise<AmmunitionInventoryRow> {
    const idx = mockAmmunitions.findIndex((x) => x.id === updated.id);
    if (idx >= 0) mockAmmunitions[idx] = { ...mockAmmunitions[idx], ...updated };
    return mockAmmunitions[idx];
  },
  async updateVehicle(updated: VehicleInventoryRow): Promise<VehicleInventoryRow> {
    const idx = mockVehicles.findIndex((x) => x.id === updated.id);
    if (idx >= 0) mockVehicles[idx] = { ...mockVehicles[idx], ...updated };
    return mockVehicles[idx];
  },
  async updateEngineeringVehicle(updated: EngineeringVehicleRow): Promise<EngineeringVehicleRow> {
    const idx = mockEngineering.findIndex((x) => x.id === updated.id);
    if (idx >= 0) mockEngineering[idx] = { ...mockEngineering[idx], ...updated };
    return mockEngineering[idx];
  },
  async updatePowerStation(updated: PowerStationRow): Promise<PowerStationRow> {
    const idx = mockPowerStations.findIndex((x) => x.id === updated.id);
    if (idx >= 0) mockPowerStations[idx] = { ...mockPowerStations[idx], ...updated };
    return mockPowerStations[idx];
  },
};


