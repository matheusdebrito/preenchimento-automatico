import type { LucideIcon } from 'lucide-react';
import { Anchor, IdCard, Ship } from 'lucide-react';

export interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
}

export const SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  {
    id: 'embarcacoes',
    title: 'Embarcações e jet skis',
    description: 'Transferência, inscrição e outros serviços.',
    icon: Ship,
    route: '/servicos/embarcacoes',
  },
  {
    id: 'amadores',
    title: 'Arrais, Mestre e Capitão',
    description: 'Inscrição, emissão e renovação da CHA.',
    icon: IdCard,
    route: '/servicos/amadores',
  },
  {
    id: 'aquaviarios',
    title: 'Aquaviários',
    description: 'CIR, certificados e documentos profissionais.',
    icon: Anchor,
    route: '/servicos/aquaviarios',
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
  id: 'transferencia-propriedade-embarcacao',
  categoryId: 'embarcacoes',
  title: 'Transferência de propriedade',
  summary: 'Barco ou moto aquática — transferência de propriedade.',
  description:
    'Reúna os documentos do comprador, do vendedor e da embarcação. Você confere cada dado antes de preparar os formulários.',
  creditCost: 1,
};


export interface PlannedService {
  id: string;
  title: string;
  summary: string;
}

/**
 * Normatively identified expansion. These entries are intentionally not links:
 * the backend only publishes a service after every selected PDF version is
 * verified and its mapping receives visual approval.
 */
export const PLANNED_VESSEL_SERVICES: readonly PlannedService[] = [
  { id: 'inscricao-embarcacao', title: 'Inscrição inicial de embarcação',
    summary: 'Cadastro inicial de embarcação de esporte e recreio.' },
  { id: 'transferencia-propriedade-embarcacao', title: 'Transferência de propriedade',
    summary: 'Mudança de proprietário da embarcação.' },
  { id: 'transferencia-jurisdicao-embarcacao', title: 'Transferência de jurisdição',
    summary: 'Mudança da CP/DL/AG responsável pela inscrição.' },
  { id: 'transferencia-propriedade-jurisdicao-embarcacao',
    title: 'Transferência de propriedade e jurisdição',
    summary: 'Mudança conjunta de proprietário e jurisdição.' },
  { id: 'renovacao-tie-embarcacao', title: 'Renovação do TIE/TIEM',
    summary: 'Preparação dos formulários para renovação do título.' },
  { id: 'segunda-via-tie-embarcacao', title: 'Renovação por perda ou extravio do TIE/TIEM',
    summary: 'Para documento antigo perdido, roubado ou extraviado; TIE digital pode ser reimpresso pelo Gov.br.' },
  { id: 'alteracao-dados-embarcacao', title: 'Alteração de dados da embarcação',
    summary: 'Atualização de características ou dados cadastrais.' },
  { id: 'alteracao-motor-embarcacao', title: 'Troca, instalação ou retirada de motor',
    summary: 'Alteração de características relacionada ao motor propulsor.' },
  { id: 'comunicacao-venda-embarcacao', title: 'Comunicação de venda',
    summary: 'Comunicação do vendedor sem substituir a transferência de propriedade.' },
];


export const PLANNED_AMATEUR_SERVICES: readonly PlannedService[] = [
  {
    id: 'inscricao-exame-amador',
    title: 'Inscrição para exame',
    summary: 'Documentação para inscrição nos exames de Arrais, Mestre ou Capitão, sem inventar formulário não indicado pela norma.',
  },
  {
    id: 'renovacao-cha-amador',
    title: 'Renovação da CHA',
    summary: 'Preenchimento dos formulários de renovação para Arrais, Mestre ou Capitão, inclusive em caso de perda, roubo, furto ou dano da cédula.',
  },
];
