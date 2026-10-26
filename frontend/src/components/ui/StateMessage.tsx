import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

interface StateMessageProps {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  variant?: 'empty' | 'error';
  icon?: ReactNode;
}

export function StateMessage({ title, children, actions, variant = 'empty', icon }: StateMessageProps) {
  const defaultIcon =
    variant === 'error' ? <AlertCircle aria-hidden="true" /> : <Inbox aria-hidden="true" />;

  return (
    <div className="state">
      <div className="state__icon">{icon ?? defaultIcon}</div>
      <h2 className="state__title">{title}</h2>
      {children ? <div className="state__text">{children}</div> : null}
      {actions ? <div className="state__actions">{actions}</div> : null}
    </div>
  );
}
