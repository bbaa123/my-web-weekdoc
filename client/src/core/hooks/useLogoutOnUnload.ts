/**
 * useLogoutOnUnload
 *
 * 브라우저 탭 닫기 / 새로고침 / 주소 이동 시 로그아웃 시간을 서버에 기록합니다.
 * callLogoutApi 와 동일한 keepalive fetch 방식을 사용합니다.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { callLogoutApi } from '@/domains/users/api';

export function useLogoutOnUnload() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    window.addEventListener('beforeunload', callLogoutApi);
    return () => {
      window.removeEventListener('beforeunload', callLogoutApi);
    };
  }, [isAuthenticated]);
}
