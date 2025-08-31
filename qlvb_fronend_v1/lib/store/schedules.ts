// Create a store for schedules using Zustand

import { create } from "zustand"
import type { ScheduleDTO as Schedule } from "@/lib/api/schedules"

interface SchedulesState {
  schedules: Schedule[]
  loading: boolean
  setSchedules: (schedules: Schedule[]) => void
  setLoading: (loading: boolean) => void
  addSchedule: (schedule: Schedule) => void
  updateSchedule: (id: string, scheduleData: Partial<Schedule>) => void
  deleteSchedule: (id: string) => void
}

export const useSchedules = create<SchedulesState>((set) => ({
  schedules: [],
  loading: false,
  setSchedules: (schedules) => set({ schedules }),
  setLoading: (loading) => set({ loading }),
  addSchedule: (schedule) => set((state) => ({ schedules: [...state.schedules, schedule] })),
  updateSchedule: (id, scheduleData) =>
    set((state) => ({
      schedules: state.schedules.map((schedule) => (schedule.id === id ? { ...schedule, ...scheduleData } : schedule)),
    })),
  deleteSchedule: (id) =>
    set((state) => ({
      schedules: state.schedules.filter((schedule) => schedule.id !== id),
    })),
}))
