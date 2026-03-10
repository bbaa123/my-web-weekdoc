/**
 * Department Store
 * 부서 관리 전역 상태 관리 (Zustand)
 */

import { create } from 'zustand';
import {
  fetchDepartments,
  fetchActiveDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './api';
import type { Department, DepartmentCreate, DepartmentUpdate } from './types';

interface DepartmentState {
  departments: Department[];
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchActive: () => Promise<void>;
  create: (data: DepartmentCreate) => Promise<void>;
  update: (deptCode: string, data: DepartmentUpdate) => Promise<void>;
  remove: (deptCode: string) => Promise<void>;
}

export const useDepartmentStore = create<DepartmentState>((set) => ({
  departments: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchDepartments();
      set({ departments: data, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '부서 목록 조회 실패';
      set({ error: message, loading: false });
    }
  },

  fetchActive: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchActiveDepartments();
      set({ departments: data, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '사용 중인 부서 목록 조회 실패';
      set({ error: message, loading: false });
    }
  },

  create: async (data: DepartmentCreate) => {
    set({ loading: true, error: null });
    try {
      const newDept = await createDepartment(data);
      set((state) => ({
        departments: [...state.departments, newDept],
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '부서 생성 실패';
      set({ error: message, loading: false });
    }
  },

  update: async (deptCode: string, data: DepartmentUpdate) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateDepartment(deptCode, data);
      set((state) => ({
        departments: state.departments.map((d) =>
          d.dept_code === deptCode ? updated : d,
        ),
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '부서 수정 실패';
      set({ error: message, loading: false });
    }
  },

  remove: async (deptCode: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDepartment(deptCode);
      set((state) => ({
        departments: state.departments.filter((d) => d.dept_code !== deptCode),
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '부서 삭제 실패';
      set({ error: message, loading: false });
    }
  },
}));
