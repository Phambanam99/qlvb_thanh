import { create } from "zustand";
import { schedulesAPI, ScheduleDTO } from "../api/schedules";

// Định nghĩa state type
interface ScheduleState {
  // State
  schedules: ScheduleDTO[];
  loading: boolean;
  error: string | null;

  // Actions - không sử dụng arrow functions để tránh tham chiếu thay đổi
  fetchSchedules(): void;
  addSchedule(schedule: ScheduleDTO): void;
  updateSchedule(id: number, updates: Partial<ScheduleDTO>): void;
  deleteSchedule(id: number): void;
  resetError(): void;
}

// Tạo store với phương thức tách biệt
export const useScheduleStore = create<ScheduleState>((set, get) => ({
  // Khởi tạo state
  schedules: [],
  loading: false,
  error: null,

  // Actions
  fetchSchedules() {
    // Kiểm tra nếu đã loading thì không gọi lại API
    if (get().loading) return;

    // Set loading state
    set({ loading: true, error: null });

    // Gọi API
    schedulesAPI
      .getAllSchedules()
      .then((data) => {
        set({ schedules: data, loading: false });
      })
      .catch((err) => {
        set({
          error:
            err instanceof Error ? err.message : "Không thể tải lịch công tác",
          loading: false,
        });
      });
  },

  addSchedule(schedule) {
    set((state) => ({
      schedules: [...state.schedules, schedule],
    }));
  },

  updateSchedule(id, updates) {
    set((state) => ({
      schedules: state.schedules.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  deleteSchedule(id) {
    set((state) => ({
      schedules: state.schedules.filter((item) => item.id !== id),
    }));
  },

  resetError() {
    set({ error: null });
  },
}));
