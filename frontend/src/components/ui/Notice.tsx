import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cx } from '../../lib/cx';

export type NoticeTone = 'info' | 'demo' | 'success' | 'danger';

interface NoticeProps {
  children: ReactNode;
  tone?: NoticeTone;
  title?: string;
  icon?: ReactNode;
  className?: string;
  role?: 'alert' | 'status' | 'note';
}

const toneIcons: Record<NoticeTone, ReactNode> = {
  info: <Info aria-hidden="true" />,
  demo: <Info aria-hidden="true" />,
  success: <CheckCircle2 aria-hidden="true" />,
  danger: <AlertCircle aria-hidden="true" />,
};

export function Notice({ children, tone = 'info', title, icon, className, role }: NoticeProps) {
  return (
    <div className={cx('notice', `notice--${tone}`, className)} role={role}>
      {icon ?? toneIcons[tone]}
      <div>
        {title ? <strong className="notice__title">{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}
