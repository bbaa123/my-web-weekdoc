/**
 * Org Chart 도메인 타입 정의
 */

export interface OrgChartUser {
  id: string;
  name: string;
  position: string | null;
  email: string;
  tel: string | null;
  job: string | null;
  nicname: string | null;
  picture: string | null;
  latest_report_year: string | null;
  latest_report_month: string | null;
  latest_report_week: string | null;
  latest_report_status: string | null;
}

export interface OrgChartDept {
  dept_code: string;
  dept_name: string;
  parent_dept_code: string | null;
  dept_level: number | null;
  sort_order: number;
  users: OrgChartUser[];
}

/** 트리 렌더링을 위한 노드 타입 */
export interface DeptTreeNode extends OrgChartDept {
  children: DeptTreeNode[];
}
