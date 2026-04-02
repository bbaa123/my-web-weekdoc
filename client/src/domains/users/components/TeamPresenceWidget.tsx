/**
 * TeamPresenceWidget
 *
 * 팀원 전체의 접속 현황(온라인 🟢 / 오프라인 ⚪)을 보여주는 위젯.
 *
 * 판단 로직: 서버에서 is_online = (last_login_at > last_logout_at) 으로 계산해서 내려줌.
 *
 * 폴링: 60초마다 자동 갱신 (실시간 소켓 미사용).
 */

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { fetchPresence } from '../api';
import type { PresenceUser } from '../types';

const POLL_INTERVAL_MS = 60_000;

function formatLastSeen(isoString: string | null): string {
  if (!isoString) return '기록 없음';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function MemberRow({ user }: { user: PresenceUser }) {
  const initials = (user.nicname || user.name)
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const displayName = user.nicname || user.name;

  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      {/* 아바타 */}
      <div className="relative shrink-0">
        {user.picture ? (
          <img
            src={user.picture}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold select-none">
            {initials}
          </div>
        )}
        {/* 상태 점 */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            user.is_online ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          title={user.is_online ? '접속 중' : '미접속'}
        />
      </div>

      {/* 이름 + 부서 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
        <p className="text-xs text-slate-400 truncate">{user.department ?? user.email}</p>
      </div>

      {/* 상태 표시 */}
      <div className="shrink-0 text-right">
        {user.is_online ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            🟢 접속 중
          </span>
        ) : (
          <span className="text-xs text-slate-400">
            ⚪ {formatLastSeen(user.last_logout_at ?? user.last_login_at)}
          </span>
        )}
      </div>
    </li>
  );
}

interface TeamPresenceWidgetProps {
  /** 최대 표시 인원 (기본: 전원) */
  limit?: number;
}

export function TeamPresenceWidget({ limit }: TeamPresenceWidgetProps) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const data = await fetchPresence();
      // 온라인 먼저, 이름 순
      const sorted = [...data].sort((a, b) => {
        if (a.is_online !== b.is_online) return a.is_online ? -1 : 1;
        return (a.nicname || a.name).localeCompare(b.nicname || b.name, 'ko');
      });
      setUsers(limit ? sorted.slice(0, limit) : sorted);
      setLastUpdated(new Date());
    } catch {
      // 오류 시 현재 목록 유지
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onlineCount = users.filter((u) => u.is_online).length;
  const totalCount = users.length;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Users size={16} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">팀원 접속 현황</h3>
            {!loading && (
              <p className="text-xs text-slate-400">
                <span className="text-emerald-600 font-semibold">{onlineCount}명</span> 접속 중
                {totalCount > 0 && ` / 전체 ${totalCount}명`}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 disabled:opacity-40"
          title="새로고침"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 멤버 리스트 */}
      <div className="px-4">
        {loading ? (
          <div className="py-8 text-center">
            <RefreshCw size={20} className="animate-spin text-slate-300 mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">팀원 데이터가 없습니다</p>
        ) : (
          <ul>
            {users.map((u) => (
              <MemberRow key={u.id} user={u} />
            ))}
          </ul>
        )}
      </div>

      {/* 푸터: 마지막 갱신 */}
      {lastUpdated && (
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            마지막 갱신: {lastUpdated.toLocaleTimeString('ko-KR')} · 60초마다 자동 갱신
          </p>
        </div>
      )}
    </div>
  );
}
