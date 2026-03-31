import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  LogOut,
  Shield,
  User,
  ChevronDown,
  ChevronRight,
  Mail,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Minus,
  Building2,
  Phone,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { UserAvatar } from '@/core/ui/UserAvatar';
import { fetchOrgChart } from '../api';
import type { OrgChartDept, OrgChartUser, DeptTreeNode } from '../types';

// ─── 상수 ──────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00';

// ─── 유틸: flat 배열 → 트리 변환 ────────────────────────────────────────────

function buildTree(depts: OrgChartDept[]): DeptTreeNode[] {
  const nodeMap = new Map<string, DeptTreeNode>();
  depts.forEach((d) =>
    nodeMap.set(d.dept_code, { ...d, children: [] }),
  );

  const roots: DeptTreeNode[] = [];
  nodeMap.forEach((node) => {
    if (node.parent_dept_code && nodeMap.has(node.parent_dept_code)) {
      nodeMap.get(node.parent_dept_code)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 각 레벨 sort_order 기준 정렬
  const sortChildren = (nodes: DeptTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);
  return roots;
}

// ─── 보고서 상태 배지 ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  COMPLETED: {
    label: '완료',
    icon: <CheckCircle2 size={12} />,
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  'IN PROGRESS': {
    label: '진행중',
    icon: <Clock size={12} />,
    cls: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  PENDING: {
    label: '대기',
    icon: <AlertCircle size={12} />,
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  DELAYED: {
    label: '지연',
    icon: <XCircle size={12} />,
    cls: 'bg-red-50 text-red-700 border-red-200',
  },
};

function ReportStatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-50 text-slate-400 border-slate-200">
        <Minus size={11} />
        미제출
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status];
  if (!cfg) {
    return (
      <span className="text-xs text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">
        {status}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── 사용자 카드 ──────────────────────────────────────────────────────────

function UserCard({ user }: { user: OrgChartUser }) {
  const reportLabel =
    user.latest_report_year && user.latest_report_month && user.latest_report_week
      ? `${user.latest_report_year}.${user.latest_report_month} ${user.latest_report_week}`
      : null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-orange-200 hover:shadow-sm transition-all group">
      {/* 아바타 또는 프로필 사진 */}
      <div className="flex-shrink-0">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-orange-100 shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.removeAttribute('style');
            }}
          />
        ) : null}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{
            background: `linear-gradient(135deg, ${BRAND}, #ff9a3c)`,
            display: user.picture ? 'none' : 'flex',
          }}
        >
          {(user.nicname || user.name).charAt(0)}
        </div>
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        {/* 이름 + 직급 + 닉네임 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 text-sm">{user.name}</span>
          {user.nicname && (
            <span className="text-[11px] text-slate-400">({user.nicname})</span>
          )}
          {user.position && (
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600">
              {user.position}
            </span>
          )}
        </div>

        {/* 이메일 */}
        <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
          <Mail size={11} />
          <span className="truncate">{user.email}</span>
        </div>

        {/* 전화번호 */}
        {user.tel && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
            <Phone size={11} />
            <span>{user.tel}</span>
          </div>
        )}

        {/* 담당 업무 */}
        {user.job && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
            <FileText size={11} className="flex-shrink-0" />
            <span className="truncate">{user.job}</span>
          </div>
        )}

        {/* 보고서 상태 */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <ReportStatusBadge status={user.latest_report_status} />
          {reportLabel && (
            <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
              <CalendarDays size={11} />
              {reportLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 부서 트리 노드 ────────────────────────────────────────────────────────

interface DeptNodeProps {
  node: DeptTreeNode;
  selectedCode: string | null;
  onSelect: (dept: DeptTreeNode) => void;
  depth?: number;
}

function DeptNode({ node, selectedCode, onSelect, depth = 0 }: DeptNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedCode === node.dept_code;
  const hasChildren = node.children.length > 0;

  const handleClick = () => {
    onSelect(node);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  return (
    <div className="relative">
      {/* 커넥터 선 (depth > 0) */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 border-l-2 border-orange-100"
          style={{ left: `${(depth - 1) * 28 + 14}px` }}
        />
      )}

      {/* 부서 카드 */}
      <div
        className="relative flex items-center"
        style={{ paddingLeft: `${depth * 28}px` }}
      >
        {/* 수평 연결선 */}
        {depth > 0 && (
          <div
            className="absolute border-t-2 border-orange-100"
            style={{
              left: `${(depth - 1) * 28 + 14}px`,
              width: '14px',
              top: '50%',
            }}
          />
        )}

        <button
          onClick={handleClick}
          className={`
            flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl
            transition-all duration-150 border-2 my-1
            ${
              isSelected
                ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100'
                : 'border-transparent bg-white hover:border-orange-200 hover:bg-orange-50/50 shadow-sm'
            }
          `}
        >
          {/* 펼치기/접기 토글 */}
          {hasChildren ? (
            <button
              onClick={handleToggle}
              className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-orange-100 flex-shrink-0 transition-colors"
            >
              {expanded ? (
                <ChevronDown size={13} style={{ color: BRAND }} />
              ) : (
                <ChevronRight size={13} style={{ color: BRAND }} />
              )}
            </button>
          ) : (
            <div className="w-5 h-5 flex-shrink-0" />
          )}

          {/* 부서 아이콘 */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isSelected ? 'bg-orange-400' : 'bg-orange-100'
            }`}
          >
            <Building2
              size={14}
              className={isSelected ? 'text-white' : 'text-orange-500'}
            />
          </div>

          {/* 부서명 */}
          <div className="flex-1 min-w-0">
            <span
              className={`text-sm font-semibold truncate block ${
                isSelected ? 'text-orange-700' : 'text-slate-700'
              }`}
            >
              {node.dept_name}
            </span>
            <span className="text-[11px] text-slate-400">
              {node.users.length}명
              {hasChildren && ` · 하위 ${node.children.length}개`}
            </span>
          </div>
        </button>
      </div>

      {/* 하위 노드 */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <DeptNode
              key={child.dept_code}
              node={child}
              selectedCode={selectedCode}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 우측 사용자 패널 ──────────────────────────────────────────────────────

interface UserPanelProps {
  dept: DeptTreeNode | null;
  allDepts: DeptTreeNode[];
}

function collectAllUsers(node: DeptTreeNode): OrgChartUser[] {
  return [
    ...node.users,
    ...node.children.flatMap(collectAllUsers),
  ];
}

function UserPanel({ dept, allDepts }: UserPanelProps) {
  const [showSubDepts, setShowSubDepts] = useState(false);

  if (!dept) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
        <Users size={48} strokeWidth={1.5} />
        <p className="text-sm font-medium">부서를 선택하면 구성원 목록이 표시됩니다</p>
      </div>
    );
  }

  const directUsers = dept.users;
  const allUsers = collectAllUsers(dept);
  const displayUsers = showSubDepts ? allUsers : directUsers;
  const hasChildren = dept.children.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* 패널 헤더 */}
      <div className="p-4 border-b border-slate-100 bg-orange-50/50">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: BRAND }}
          >
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">{dept.dept_name}</h2>
            <p className="text-xs text-slate-400">
              직속 {directUsers.length}명
              {hasChildren && ` · 전체 ${allUsers.length}명`}
            </p>
          </div>
        </div>

        {hasChildren && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowSubDepts(false)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all ${
                !showSubDepts
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-orange-300'
              }`}
            >
              직속 구성원
            </button>
            <button
              onClick={() => setShowSubDepts(true)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all ${
                showSubDepts
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-orange-300'
              }`}
            >
              전체 구성원
            </button>
          </div>
        )}
      </div>

      {/* 사용자 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {displayUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
            <User size={36} strokeWidth={1.5} />
            <p className="text-sm">등록된 구성원이 없습니다</p>
          </div>
        ) : (
          displayUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────

export function OrgChartPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [deptTree, setDeptTree] = useState<DeptTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<DeptTreeNode | null>(null);
  const [totalDepts, setTotalDepts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const loadOrgChart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrgChart();
      const tree = buildTree(data);
      setDeptTree(tree);
      setTotalDepts(data.length);
      setTotalUsers(data.reduce((acc, d) => acc + d.users.length, 0));
    } catch {
      toast.error('조직도 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgChart();
  }, [loadOrgChart]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isAdmin = user?.is_admin ?? false;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── 헤더 ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* 로고 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: BRAND }}
            >
              <Users size={14} className="text-white" />
            </div>
            <span className="text-base font-black tracking-tight text-slate-800">
              Weekly<span style={{ color: BRAND }}>Sync</span>
            </span>
          </div>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
            <button
              onClick={() => navigate('/weekly-sync')}
              className="hover:text-slate-700 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/weekly-sync')}
              className="hover:text-slate-700 transition-colors"
            >
              Reports
            </button>
            <span
              className="border-b-2 pb-0.5"
              style={{ color: BRAND, borderColor: BRAND }}
            >
              Team
            </span>
          </nav>

          {/* 사용자 정보 + 로그아웃 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my-page')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-all cursor-pointer"
              title="My Page로 이동"
            >
              <UserAvatar picture={user.picture} nicname={user.nicname} name={user.name} size="sm" />
              <span className="text-sm font-semibold text-slate-700">
                {user.nicname || user.name}
              </span>
              {isAdmin && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-100"
                  style={{ color: BRAND }}
                >
                  관리자
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={15} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* ── 페이지 타이틀 ─────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto w-full px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">조직도</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              부서를 클릭하면 구성원과 보고서 현황을 확인할 수 있습니다
            </p>
          </div>
          {/* 요약 뱃지 */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Building2 size={15} style={{ color: BRAND }} />
              <span className="text-sm font-bold text-slate-700">{totalDepts}개 부서</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Users size={15} style={{ color: BRAND }} />
              <span className="text-sm font-bold text-slate-700">{totalUsers}명</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ──────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto w-full px-6 pb-8 flex-1 flex gap-4 mt-4 min-h-0">
        {/* 왼쪽: 조직도 트리 */}
        <div className="w-[420px] flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Briefcase size={15} style={{ color: BRAND }} />
            <span className="text-sm font-bold text-slate-700">부서 트리</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-300">
                <div
                  className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${BRAND}40`, borderTopColor: 'transparent' }}
                />
              </div>
            ) : deptTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-2">
                <Building2 size={40} strokeWidth={1.5} />
                <p className="text-sm">등록된 부서가 없습니다</p>
              </div>
            ) : (
              deptTree.map((root) => (
                <DeptNode
                  key={root.dept_code}
                  node={root}
                  selectedCode={selectedDept?.dept_code ?? null}
                  onSelect={setSelectedDept}
                  depth={0}
                />
              ))
            )}
          </div>
        </div>

        {/* 오른쪽: 사용자 패널 */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <UserPanel dept={selectedDept} allDepts={deptTree} />
        </div>
      </div>
    </div>
  );
}
