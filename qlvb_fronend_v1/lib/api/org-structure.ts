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
  101: {
    id: 101,
    fullName: "Hà Đình Hương",
    photoUrl: "/placeholder-user.jpg",
    serviceNumber: "89 010 001",
    birthDate: "03/1978",
    ethnicity: "Kinh",
    religion: "Không",
    hometown: "Hà Trung, Thanh Hóa",
    currentResidence: "Hà Nội",
    enlistDate: "09/1996",
    partyJoinDate: "10/1998",
    partyOfficialDate: "10/1999",
    generalEducation: "12/12",
    training: [
      "HV Chính trị QG, 2001-2005",
      "HV Quốc phòng, 2014-2015",
    ],
    titles: "—",
    awards: ["Bằng khen BQP (2022)"],
    discipline: "Không",
    rank: "Đại tá (7/2023)",
    partyMember: true,
  },
  102: {
    id: 102,
    fullName: "Nguyễn Văn Công",
    photoUrl: "/placeholder-user.jpg",
    serviceNumber: "89 010 002",
    birthDate: "08/1979",
    hometown: "Yên Bái",
    currentResidence: "Hà Nội",
    enlistDate: "09/1997",
    partyJoinDate: "1999",
    partyOfficialDate: "2000",
    generalEducation: "12/12",
    training: ["HV Chính trị, 2000-2004"],
    rank: "Đại tá (12/2023)",
    partyMember: true,
  },
  103: {
    id: 103,
    fullName: "Trần Trung Thành",
    photoUrl: "/placeholder-user.jpg",
    serviceNumber: "89 010 003",
    birthDate: "04/1980",
    hometown: "Hải Dương",
    currentResidence: "Hà Nội",
    enlistDate: "09/1998",
    partyJoinDate: "2000",
    partyOfficialDate: "2001",
    generalEducation: "12/12",
    training: ["Trường SQ Lục quân, 1998-2002"],
    rank: "Thượng tá (6/2024)",
    partyMember: true,
  },
  201: {
    id: 201,
    fullName: "Trần Trung Thành",
    photoUrl: "/placeholder-user.jpg",
    serviceNumber: "89 020 001",
    birthDate: "02/1982",
    hometown: "Nam Định",
    currentResidence: "Hà Nội",
    enlistDate: "2001",
    partyJoinDate: "2003",
    partyOfficialDate: "2004",
    generalEducation: "12/12",
    training: ["Trường SQ Công binh, 2001-2005"],
    rank: "Thượng tá (2024)",
    partyMember: true,
  },
  202: {
    id: 202,
    fullName: "Nguyễn Văn B",
    photoUrl: "/placeholder-user.jpg",
    serviceNumber: "89 020 002",
    birthDate: "10/1984",
    hometown: "Thái Bình",
    currentResidence: "Hà Nội",
    enlistDate: "2002",
    generalEducation: "12/12",
    training: ["Trường SQ Công binh, 2002-2006"],
    rank: "Thiếu tá (2023)",
    partyMember: true,
  },
  301: {
    id: 301,
    fullName: "Nguyễn Văn C",
    photoUrl: "/placeholder-user.jpg",
    serviceNumber: "89 030 001",
    birthDate: "11/1983",
    hometown: "Nghệ An",
    currentResidence: "Hà Nội",
    enlistDate: "2002",
    training: ["HV Báo chí, 2003-2007"],
    rank: "Thiếu tá (2022)",
    partyMember: true,
  },
  401: {
    id: 401,
    fullName: "Phạm Văn A",
    photoUrl: "/placeholder-user.jpg",
    serviceNumber: "89 040 001",
    birthDate: "07/1985",
    hometown: "Phú Thọ",
    currentResidence: "Quảng Ninh",
    enlistDate: "2004",
    training: ["Trường SQ Lục quân, 2004-2008"],
    rank: "Thiếu tá (2021)",
    partyMember: true,
  },
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
  101: [
    { from: "09/1996", to: "07/2000", unit: "HV Chính trị", role: "Học viên" },
    { from: "08/2000", to: "12/2013", unit: "Lữ đoàn 279", role: "Cán bộ", rankAtThatTime: "3/1" },
    { from: "01/2014", to: "nay", unit: "Lữ đoàn 279", role: "Lữ đoàn trưởng", rankAtThatTime: "Đại tá" },
  ],
  102: [
    { from: "09/1997", to: "06/2001", unit: "HV Chính trị", role: "Học viên" },
    { from: "07/2001", to: "12/2019", unit: "Lữ đoàn 279", role: "Cán bộ Chính trị" },
    { from: "01/2020", to: "nay", unit: "Lữ đoàn 279", role: "Chính ủy" },
  ],
  103: [
    { from: "09/1998", to: "07/2002", unit: "Trường SQ Lục quân", role: "Học viên" },
    { from: "08/2002", to: "12/2019", unit: "Lữ đoàn 279", role: "Cán bộ tham mưu" },
    { from: "01/2020", to: "nay", unit: "Lữ đoàn 279", role: "Tham mưu trưởng" },
  ],
  201: [
    { from: "09/2001", to: "07/2005", unit: "Trường SQ Công binh", role: "Học viên" },
    { from: "08/2005", to: "12/2019", unit: "Phòng Tham mưu", role: "Cán bộ" },
    { from: "01/2020", to: "nay", unit: "Phòng Tham mưu", role: "Trưởng phòng" },
  ],
  202: [
    { from: "09/2002", to: "07/2006", unit: "Trường SQ Công binh", role: "Học viên" },
    { from: "08/2006", to: "nay", unit: "Phòng Tham mưu", role: "Phó trưởng phòng" },
  ],
  301: [
    { from: "2003", to: "2007", unit: "HV Báo chí", role: "Sinh viên" },
    { from: "2008", to: "nay", unit: "Phòng Chính trị", role: "Chánh văn phòng" },
  ],
  401: [
    { from: "2004", to: "2008", unit: "Trường SQ Lục quân", role: "Học viên" },
    { from: "2009", to: "nay", unit: "Tiểu đoàn 1", role: "Tiểu đoàn trưởng" },
  ],
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
