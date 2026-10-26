import type { LucideIcon } from 'lucide-react';
import { Anchor, IdCard, Ship } from 'lucide-react';

export interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Can open the preview; does NOT mean an officially available service. */
  demoAvailable: boolean;
  serviceId?: string;
}

export const SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  {
    id: 'embarcacoes',
    title: 'Embarcações e jet skis',
    description: 'Transferência, inscrição e outros serviços.',
    icon: Ship,
    demoAvailable: true,
    serviceId: 'transferencia-moto-aquatica',
  },
  {
    id: 'amadores',
    title: 'Arrais, Mestre e Capitão',
    description: 'Inscrição, renovação e segunda via.',
    icon: IdCard,
    demoAvailable: false,
  },
  {
    id: 'aquaviarios',
    title: 'Aquaviários',
    description: 'CIR, certificados e documentos profissionais.',
    icon: Anchor,
    demoAvailable: false,
  },
];

export interface ServiceDefinition {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  description: string;
  creditCost: number;
}

export const PILOT_SERVICE: ServiceDefinition = {
  id: 'transferencia-moto-aquatica',
  categoryId: 'embarcacoes',
  title: 'Transferência de moto aquática',
  summary: 'Jet ski — transferência de propriedade.',
  description:
    'Reúna os documentos do comprador, do vendedor e da embarcação. Você confere cada dado antes de preparar os formulários.',
  creditCost: 1,
};
