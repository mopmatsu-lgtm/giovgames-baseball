import React from 'react';

interface Props {
  avatar?: any;
  teamColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// ユーザー指示に基づき、選手のイラスト表示は無効化（非表示）
export const PlayerAvatar: React.FC<Props> = () => {
  return null;
};
