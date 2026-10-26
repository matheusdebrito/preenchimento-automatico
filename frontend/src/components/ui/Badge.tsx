import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export type BadgeTone =
  | 'soon'
  | 'demo'
  | 'test'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ children, tone = 'neutral', icon, className }: BadgeProps) {
  return (
    <span className={cx('badge', `badge--${tone}`, className)}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
