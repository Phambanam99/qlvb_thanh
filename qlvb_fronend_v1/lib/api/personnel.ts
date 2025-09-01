import { ResponseDTO } from "./types";

export interface PersonnelDailyRowDTO {
  id: number | string;
  unitName: string;
  siQuan: number;
  qncn: number;
  hsqBs: number;
  phepTT: number;
  vien: number;
  hocXa: number;
  cheDo: number;
  congTacXa: number;
  doMin: number;
  benhXa: number;
  note?: string;
}

export interface PersonnelDailyDTO {
  date: string; // yyyy-MM-dd
  rows: PersonnelDailyRowDTO[];
}

// Simple in-memory mock store
const mockStore: Record<string, PersonnelDailyDTO> = {};

const defaultUnits: string[] = [
  "CH Lữ đoàn",
  "Phòng Tham mưu",
  "Phòng Chính trị",
  "Phòng HC-KT",
  "Tiểu đoàn 1",
  "Tiểu đoàn 2",
  "Tiểu đoàn 3",
];

function createEmpty(date: string): PersonnelDailyDTO {
  return {
    date,
    rows: defaultUnits.map((name, idx) => ({
      id: idx + 1,
      unitName: name,
      siQuan: 0,
      qncn: 0,
      hsqBs: 0,
      phepTT: 0,
      vien: 0,
      hocXa: 0,
      cheDo: 0,
      congTacXa: 0,
      doMin: 0,
      benhXa: 0,
      note: "",
    })),
  };
}

export const personnelAPI = {
  async getDaily(date: string): Promise<ResponseDTO<PersonnelDailyDTO>> {
    const key = date;
    if (!mockStore[key]) {
      mockStore[key] = createEmpty(date);
    }
    return {
      success: true,
      message: "Success",
      data: mockStore[key],
    } as ResponseDTO<PersonnelDailyDTO>;
  },

  async saveDaily(payload: PersonnelDailyDTO): Promise<ResponseDTO<PersonnelDailyDTO>> {
    mockStore[payload.date] = payload;
    return {
      success: true,
      message: "Saved",
      data: mockStore[payload.date],
    } as ResponseDTO<PersonnelDailyDTO>;
  },
};


