/**
 * Department 도메인 타입 정의
 */

export interface Department {
  dept_code: string;
  dept_name: string;
  parent_dept_code: string | null;
  use_yn: 'Y' | 'N';
  dept_level: number | null;
  sort_order: number;
  created_at: string;
}

export interface DepartmentCreate {
  dept_code: string;
  dept_name: string;
  parent_dept_code: string | null;
  use_yn: 'Y' | 'N';
  dept_level: number | null;
  sort_order: number;
}

export interface DepartmentUpdate {
  dept_name?: string;
  parent_dept_code?: string | null;
  use_yn?: 'Y' | 'N';
  dept_level?: number | null;
  sort_order?: number;
}
