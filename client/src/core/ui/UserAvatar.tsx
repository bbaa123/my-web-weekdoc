/**
 * UserAvatar - 사용자 아바타 컴포넌트
 *
 * 우선순위: 프로필 사진 > 닉네임 이니셜 > 이름 이니셜
 */

import React from 'react';

const BRAND = '#FF6B00';

const SIZE_CLASS: Record<string, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-10 h-10 text-sm',
};

interface UserAvatarProps {
  picture?: string | null;
  nicname?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  picture,
  nicname,
  name,
  size = 'md',
  className = '',
}) => {
  const displayName = nicname || name;
  const initials = displayName.slice(0, 2).toUpperCase();
  const sizeClass = SIZE_CLASS[size];

  if (picture) {
    return (
      <img
        src={picture}
        alt={displayName}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (sibling) sibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
      style={{ backgroundColor: BRAND }}
    >
      {initials}
    </div>
  );
};
