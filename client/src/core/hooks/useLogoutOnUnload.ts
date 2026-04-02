/**
 * useLogoutOnUnload
 *
 * 브라우저 탭 닫기 / 새로고침 / 주소 이동 시 로그아웃 시간을 서버에 기록합니다.
 *
 * 동작 원리:
 *  - beforeunload 이벤트에서 fetch({ keepalive: true })를 사용합니다.
 *  - keepalive 옵션은 페이지 언로드 이후에도 요청을 완료시켜 주는 브라우저 표준 기능입니다.
 *  - navigator.sendBeacon은 헤더를 커스터마이징할 수 없어 Bearer 토큰 전달이 불가하므로
 *    keepalive fetch 방식을 사용합니다.
 *
 * 사용 위치: 인증된 사용자가 접근하는 최상위 레이아웃 컴포넌트(예: PrivateRoute 내부 또는 App)
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/core/store/useAuthStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

export function useLogoutOnUnload() {
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const handleBeforeUnload = () => {
      fetch(`${API_BASE}/v1/login-auth/logout`, {
        method: 'POST',
        keepalive: true,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token, isAuthenticated]);
}
