import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useLogoutOnUnload } from '@/core/hooks/useLogoutOnUnload';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  // 탭 닫기 / 새로고침 시 로그아웃 시간 기록
  useLogoutOnUnload();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
