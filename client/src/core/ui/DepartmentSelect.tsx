/**
 * DepartmentSelect - 부서 선택 드롭다운 공통 컴포넌트
 *
 * departments 테이블의 활성 부서(use_yn='Y')를 API로 조회하여
 * 사용자에게는 부서명(dept_name)을 보여주고, 저장 시에는 부서 코드(dept_code)를 사용.
 */

import { useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useDepartmentStore } from '@/domains/departments/store';

interface DepartmentSelectProps {
  /** 선택된 부서 코드 (dept_code) */
  value: string;
  /** 부서 코드 변경 핸들러 */
  onChange: (deptCode: string) => void;
  placeholder?: string;
  required?: boolean;
  /** 왼쪽에 아이콘 표시 여부 (회원가입 등 입력 폼 스타일) */
  withIcon?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
  /** select 요소에 직접 적용할 인라인 스타일 */
  style?: React.CSSProperties;
}

export function DepartmentSelect({
  value,
  onChange,
  placeholder = '부서를 선택하세요',
  required = false,
  withIcon = false,
  className = '',
  style,
}: DepartmentSelectProps) {
  const { departments, fetchActive } = useDepartmentStore();

  useEffect(() => {
    if (departments.length === 0) {
      fetchActive();
    }
  }, [departments.length, fetchActive]);

  const baseClass =
    'w-full border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all';

  if (withIcon) {
    return (
      <div className="relative">
        <Building2
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`${baseClass} pl-10 pr-4 py-3 ${className}`}
          style={style}
        >
          <option value="">{placeholder}</option>
          {departments.map((dept) => (
            <option key={dept.dept_code} value={dept.dept_code}>
              {dept.dept_name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={`${baseClass} px-3 py-2.5 ${className}`}
      style={style}
    >
      <option value="">{placeholder}</option>
      {departments.map((dept) => (
        <option key={dept.dept_code} value={dept.dept_code}>
          {dept.dept_name}
        </option>
      ))}
    </select>
  );
}
