/**
 * Users 도메인 타입 정의
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  department: string | null;
  position: string | null;
  admin_yn: boolean;
  exists_in_users: boolean;
}

export interface UserUpsertRequest {
  name: string;
  email: string;
  department: string | null;
  position: string | null;
  admin_yn: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export const DEPARTMENT_OPTIONS = ['ERP1팀', 'ERP2팀', 'ERP3팀', 'ERP4팀'] as const;
export const POSITION_OPTIONS = ['임원', '팀장', '매니저'] as const;

export type Department = (typeof DEPARTMENT_OPTIONS)[number];
export type Position = (typeof POSITION_OPTIONS)[number];
