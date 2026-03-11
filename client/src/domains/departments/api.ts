/**
 * Department 도메인 API 모듈
 * apiClient 싱글톤을 통해서만 HTTP 호출
 */

import { apiClient } from '@/core/api/client';
import type { Department, DepartmentCreate, DepartmentUpdate } from './types';

export async function fetchDepartments(): Promise<Department[]> {
  const response = await apiClient.get<Department[]>('/api/v1/departments');
  return response.data;
}

export async function fetchActiveDepartments(): Promise<Department[]> {
  const response = await apiClient.get<Department[]>('/api/v1/departments/active');
  return response.data;
}

export async function fetchAccessibleDepartments(): Promise<Department[]> {
  const response = await apiClient.get<Department[]>('/api/v1/departments/accessible');
  return response.data;
}

export async function fetchDepartment(deptCode: string): Promise<Department> {
  const response = await apiClient.get<Department>(`/api/v1/departments/${deptCode}`);
  return response.data;
}

export async function createDepartment(data: DepartmentCreate): Promise<Department> {
  const response = await apiClient.post<Department>('/api/v1/departments', data);
  return response.data;
}

export async function updateDepartment(
  deptCode: string,
  data: DepartmentUpdate,
): Promise<Department> {
  const response = await apiClient.patch<Department>(`/api/v1/departments/${deptCode}`, data);
  return response.data;
}

export async function deleteDepartment(deptCode: string): Promise<void> {
  await apiClient.delete(`/api/v1/departments/${deptCode}`);
}
