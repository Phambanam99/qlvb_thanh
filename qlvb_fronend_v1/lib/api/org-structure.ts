import api from "./config";

export type Period = "current" | "history";

export interface UnitNode {
  id: number;
  name: string;
  type: "HQ" | "DEPARTMENT" | "BATTALION" | "COMPANY";
  children?: UnitNode[];
}

export interface PositionHolder {
  id: number;
  fullName: string;
  positionTitle: string; // e.g. "Lữ đoàn trưởng"
}

export interface ProfileSummary {
  id: number;
  fullName: string;
  photoUrl?: string; // 3x4 portrait
  serviceNumber?: string; // Số hiệu
  birthDate: string; // dd/mm/yyyy or mm/yyyy
  ethnicity?: string;
  religion?: string;
  hometown: string; // Quê quán
  currentResidence: string; // Nơi ở hiện nay
  enlistDate?: string; // Ngày nhập ngũ
  demobilizationDate?: string; // Xuất ngũ
  partyJoinDate?: string; // Ngày vào Đảng
  partyOfficialDate?: string; // Ngày chính thức
  generalEducation?: string; // Giáo dục phổ thông
  training: string[]; // Quá trình học tập / đào tạo
  titles?: string; // Danh hiệu được phong, thăng năm
  awards?: string[]; // Khen thưởng
  discipline?: string; // Kỷ luật
  rank: string; // Cấp bậc, hệ số lương, tháng năm
  partyMember: boolean;
}

export interface CareerItem {
  from: string; // MM/YYYY
  to: string; // MM/YYYY or "nay"
  unit: string;
  role: string;
  rankAtThatTime?: string;
  partyRole?: string; // Chức vụ Đảng, Đoàn thể
  note?: string;
}

export interface GroupedHolders {
  label: string; // e.g. "Chỉ huy Lữ đoàn", "Trợ lý"
  people: PositionHolder[];
}



export const orgStructureAPI = {
  getUnitTree: async (period: Period = "current"): Promise<UnitNode> => {
    const res = await api.get("/org-structure/unit-tree", { params: { period } });
    return res.data.data as UnitNode;
  },
  
  getPositionHolders: async (unitId: number): Promise<PositionHolder[]> => {
    const res = await api.get(`/org-structure/position-holders/${unitId}`);
    return res.data.data as PositionHolder[];
  },
  
  // Grouped by functional categories for a unit
  getGroupedHolders: async (unitId: number): Promise<GroupedHolders[]> => {
    const res = await api.get(`/org-structure/grouped-holders/${unitId}`);
    return res.data.data as GroupedHolders[];
  },
  
  getProfileSummary: async (personId: number): Promise<ProfileSummary | null> => {
    const res = await api.get(`/org-structure/profile/${personId}`);
    return res.data.data as ProfileSummary | null;
  },
  
  getCareerTimeline: async (personId: number): Promise<CareerItem[]> => {
    const res = await api.get(`/org-structure/career/${personId}`);
    return res.data.data as CareerItem[];
  },
};
