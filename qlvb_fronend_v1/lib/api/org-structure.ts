// Mock API for organizational structure and personnel profiles
// View-only data used to build the UI flow for "Quản lý tổ chức biên chế"

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

// In-memory mock dataset
const tree: UnitNode = {
  id: 1,
  name: "Chỉ huy Lữ đoàn",
  type: "HQ",
  children: [
    { id: 10, name: "Phòng Tham mưu", type: "DEPARTMENT" },
    { id: 11, name: "Phòng Chính trị", type: "DEPARTMENT" },
    { id: 12, name: "Phòng Hậu cần - Kỹ thuật", type: "DEPARTMENT" },
    { id: 21, name: "Tiểu đoàn 1", type: "BATTALION" },
    { id: 22, name: "Tiểu đoàn 2", type: "BATTALION" },
    { id: 23, name: "Tiểu đoàn 3", type: "BATTALION" },
  ],
};

const holdersByUnit: Record<number, PositionHolder[]> = {
  1: [
    {
      id: 101,
      fullName: "Đại tá Hà Đình Hương",
      positionTitle: "Lữ đoàn trưởng",
    },
    { id: 102, fullName: "Đại tá Nguyễn Văn Công", positionTitle: "Chính ủy" },
    {
      id: 103,
      fullName: "Thượng tá Trần Trung Thành",
      positionTitle: "Tham mưu trưởng",
    },
    {
      id: 104,
      fullName: "Đại tá Tạ Duy Đính",
      positionTitle: "Phó Lữ đoàn trưởng",
    },
    {
      id: 105,
      fullName: "Thượng tá Lê Văn Dũng",
      positionTitle: "Phó Lữ đoàn trưởng",
    },
    {
      id: 106,
      fullName: "Thượng tá Nguyễn Văn Kha",
      positionTitle: "Phó Lữ đoàn trưởng",
    },
    {
      id: 107,
      fullName: "Thượng tá Vũ Ngọc Biên",
      positionTitle: "Phó Chính ủy",
    },
  ],
  10: [
    { id: 201, fullName: "Trần Trung Thành", positionTitle: "Trưởng phòng" },
    { id: 202, fullName: "Nguyễn Văn B", positionTitle: "Phó trưởng phòng" },
  ],
  11: [{ id: 301, fullName: "Nguyễn Văn C", positionTitle: "Chánh văn phòng" }],
  21: [{ id: 401, fullName: "Phạm Văn A", positionTitle: "Tiểu đoàn trưởng" }],
};

const profiles: Record<number, ProfileSummary> = {
  104: {
    id: 104,
    fullName: "Tạ Duy Đính",
    photoUrl: "/placeholder-user.jpg",
    serviceNumber: "89 052 513",
    birthDate: "06/1983",
    ethnicity: "Kinh",
    religion: "Không",
    hometown: "Yên Cường, Ý Yên, Nam Định",
    currentResidence: "Yên Cường, Ý Yên, Nam Định",
    enlistDate: "06/1989",
    demobilizationDate: undefined,
    partyJoinDate: "07/06/1989",
    partyOfficialDate: "07/06/1990",
    generalEducation: "12/12",
    training: [
      "Trường SQCB, Xe máy, Cao đẳng, 09/1986-11/1989",
      "Trường SQCB, HTĐH, 09/1990-01/2001",
      "Học viện KTQS, CHQLKT, 01/2013-7/2013",
    ],
    titles: "Không",
    awards: ["Chiến sĩ Thi đua cơ sở (2019, 2023)"],
    discipline: "Không",
    rank: "Đại tá NLL1 (7/2024)",
    partyMember: true,
  },
};

const careers: Record<number, CareerItem[]> = {
  104: [
    {
      from: "12/1989",
      to: "11/1993",
      unit: "Trường SQ Công binh",
      role: "Học viên",
      partyRole: "Đảng viên",
    },
    {
      from: "12/2013",
      to: "12/2019",
      unit: "Lữ đoàn 279",
      role: "Phó Lữ đoàn trưởng",
      rankAtThatTime: "3/1 | 01/2014",
      partyRole: "—",
    },
    {
      from: "01/2020",
      to: "nay",
      unit: "Lữ đoàn 279",
      role: "Phó Lữ đoàn trưởng",
      rankAtThatTime: "4/ NLL1 | 7/2024",
      partyRole: "—",
    },
  ],
};

export const orgStructureAPI = {
  getUnitTree: async (period: Period = "current"): Promise<UnitNode> => {
    await new Promise((r) => setTimeout(r, 150));
    return JSON.parse(JSON.stringify(tree));
  },
  getPositionHolders: async (unitId: number): Promise<PositionHolder[]> => {
    await new Promise((r) => setTimeout(r, 150));
    return holdersByUnit[unitId] ? [...holdersByUnit[unitId]] : [];
  },
  // Grouped by functional categories for a unit
  getGroupedHolders: async (unitId: number): Promise<GroupedHolders[]> => {
    await new Promise((r) => setTimeout(r, 120));
    if (unitId === 1) {
      return [{ label: "Chỉ huy Lữ đoàn", people: holdersByUnit[1] || [] }];
    }
    if (unitId === 10) {
      return [
        { label: "Chỉ huy phòng", people: holdersByUnit[10] || [] },
        {
          label: "Phân đội",
          people: [
            {
              id: 2101,
              fullName: "Nguyễn Văn D",
              positionTitle: "Trưởng phân đội",
            },
          ],
        },
        {
          label: "Trợ lý",
          people: [
            {
              id: 2201,
              fullName: "Lê Văn E",
              positionTitle: "Trợ lý tác chiến",
            },
            {
              id: 2202,
              fullName: "Phạm Văn F",
              positionTitle: "Trợ lý kế hoạch",
            },
          ],
        },
        {
          label: "Nhân viên",
          people: [
            {
              id: 2301,
              fullName: "Trần Thị G",
              positionTitle: "Nhân viên tổng hợp",
            },
          ],
        },
      ];
    }
    // Default: single catch-all group from flat holders list
    return [
      {
        label: "Nhân sự",
        people: holdersByUnit[unitId] || [],
      },
    ];
  },
  getProfileSummary: async (
    personId: number
  ): Promise<ProfileSummary | null> => {
    await new Promise((r) => setTimeout(r, 150));
    return profiles[personId] ? { ...profiles[personId] } : null;
  },
  getCareerTimeline: async (personId: number): Promise<CareerItem[]> => {
    await new Promise((r) => setTimeout(r, 150));
    return careers[personId] ? [...careers[personId]] : [];
  },
};
