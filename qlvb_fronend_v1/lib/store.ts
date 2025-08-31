import { create } from "zustand";
import { IncomingDocumentDTO } from "./api/incomingDocuments";
import { OutgoingDocumentDTO } from "./api/outgoingDocuments";
import { WorkPlanDTO } from "./api/workPlans";
import { ScheduleDTO } from "./api/schedules";
import { schedulesAPI } from "./api";

// Incoming Documents Store
interface IncomingDocumentsState {
  incomingDocuments: IncomingDocumentDTO[];
  loading: boolean;
  setIncomingDocuments: (documents: IncomingDocumentDTO[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useIncomingDocuments = create<IncomingDocumentsState>((set) => ({
  incomingDocuments: [],
  loading: false,
  setIncomingDocuments: (documents) => set({ incomingDocuments: documents }),
  setLoading: (loading) => set({ loading }),
}));

// Outgoing Documents Store
interface OutgoingDocumentsState {
  outgoingDocuments: any[];
  loading: boolean;
  setOutgoingDocuments: (documents: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useOutgoingDocuments = create<OutgoingDocumentsState>((set) => ({
  outgoingDocuments: [],
  loading: false,
  setOutgoingDocuments: (documents) => set({ outgoingDocuments: documents }),
  setLoading: (loading) => set({ loading }),
}));

// Work Plans Store
interface WorkPlansState {
  workPlans: WorkPlanDTO[];
  loading: boolean;
  setWorkPlans: (workPlans: WorkPlanDTO[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useWorkPlans = create<WorkPlansState>((set) => ({
  workPlans: [],
  loading: false,
  setWorkPlans: (workPlans) => set({ workPlans }),
  setLoading: (loading) => set({ loading }),
}));

// Schedules Store
interface SchedulesState {
  schedules: ScheduleDTO[];
  loading: boolean;
  error: string | null;
  fetchSchedules: () => Promise<void>;
  setSchedules: (schedules: ScheduleDTO[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const createSchedulesStore = () => {
  return create<SchedulesState>()((set, get) => ({
    schedules: [],
    loading: false,
    error: null,
    fetchSchedules: async () => {
      try {
        // Kiểm tra nếu đã đang loading thì không gọi API nữa
        if (get().loading) return;

        set({ loading: true, error: null });
        const data_ = await schedulesAPI.getAllSchedules();
        const data = data_.data;
        set({ schedules: data });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Không thể tải lịch công tác",
        });
      } finally {
        set({ loading: false });
      }
    },
    setSchedules: (schedules) => set({ schedules }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }));
};

export const useSchedules = createSchedulesStore();

// User Store
interface UserState {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: any | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useUser = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// Dashboard Store
interface DashboardState {
  stats: {
    incomingDocuments: { total: number; pending: number };
    outgoingDocuments: { total: number; pending: number };
    workPlans: { total: number; active: number };
    schedules: { total: number; today: number };
  };
  recentDocuments: any[];
  todayEvents: any[];
  loading: boolean;
  error: string | null;
  setStats: (stats: any) => void;
  setRecentDocuments: (documents: any[]) => void;
  setTodayEvents: (events: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDashboard = create<DashboardState>((set) => ({
  stats: {
    incomingDocuments: { total: 0, pending: 0 },
    outgoingDocuments: { total: 0, pending: 0 },
    workPlans: { total: 0, active: 0 },
    schedules: { total: 0, today: 0 },
  },
  recentDocuments: [],
  todayEvents: [],
  loading: false,
  error: null,
  setStats: (stats) => set({ stats }),
  setRecentDocuments: (documents) =>
    set({ recentDocuments: documents.filter((doc) => doc !== null) }),
  setTodayEvents: (events) => set({ todayEvents: events }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
