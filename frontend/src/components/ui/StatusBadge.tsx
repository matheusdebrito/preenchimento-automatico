import { AlertCircle, CheckCircle2, CircleAlert } from 'lucide-react';
import type { FieldStatus } from '../../data/demo';
import { Badge } from './Badge';
import type { BadgeTone } from './Badge';

interface StatusConfig {
  label: string;
  tone: BadgeTone;
  Icon: typeof CheckCircle2;
}

const STATUS_CONFIG: Record<FieldStatus, StatusConfig> = {
  confirmado: { label: 'Confirmado', tone: 'success', Icon: CheckCircle2 },
  revisar: { label: 'Precisa conferir', tone: 'warning', Icon: AlertCircle },
  nao_encontrado: { label: 'Não encontrado', tone: 'danger', Icon: CircleAlert },
};

export function StatusBadge({ status }: { status: FieldStatus }) {
  const item = STATUS_CONFIG[status];
  const Icon = item.Icon;

  return (
    <Badge tone={item.tone} icon={<Icon aria-hidden="true" />}>
      {item.label}
    </Badge>
  );
}
