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
  title: 'Transferência de propriedade e/ou jurisdição',
  summary: 'Barco ou moto aquática — propriedade, jurisdição ou ambas.',
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
  { id: 'transferencia-propriedade-embarcacao',
    title: 'Transferência de propriedade e/ou jurisdição',
    summary: 'Mudança de proprietário, jurisdição ou ambas no mesmo fluxo.' },
  { id: 'renovacao-tie-embarcacao', title: 'Renovação do TIE/TIEM',
    summary: 'Preparação dos formulários para renovação do título.' },
  { id: 'segunda-via-tie-embarcacao', title: 'Renovação por perda ou extravio do TIE/TIEM',
    summary: 'Para documento antigo perdido, roubado ou extraviado; TIE digital pode ser reimpresso pelo Gov.br.' },
  { id: 'alteracao-dados-embarcacao', title: 'Alteração de dados, características ou motor',
    summary: 'Atualização de dados e características, inclusive troca, instalação ou retirada de motor.' },
  { id: 'comunicacao-venda-embarcacao', title: 'Comunicação de venda',
    summary: 'Comunicação do vendedor sem substituir a transferência de propriedade.' },
];


export const PLANNED_AQUAVIARIO_SERVICES: readonly PlannedService[] = [
  { id: 'inscricao-inicial-cir-aquaviario', title: 'Inscrição inicial / emissão da CIR',
    summary: 'Preparação dos documentos disponíveis na NORMAM-101 para a inscrição inicial.' },
  { id: 'segunda-via-cir-aquaviario', title: '2ª via da CIR',
    summary: 'Para dano, extravio, roubo ou furto da Caderneta de Inscrição e Registro.' },
  { id: 'revalidacao-cir-aquaviario', title: 'Revalidação da CIR',
    summary: 'Preparação dos documentos para revalidação da Caderneta de Inscrição e Registro.' },
  { id: 'transferencia-jurisdicao-aquaviario', title: 'Transferência de jurisdição',
    summary: 'Mudança da Organização Militar de jurisdição do aquaviário.' },
  { id: 'ascensao-categoria-aquaviario', title: 'Ascensão de categoria',
    summary: 'Preparação documental para progressão de categoria profissional.' },
  { id: 'transferencia-categoria-grupo-aquaviario', title: 'Transferência de categoria ou grupo',
    summary: 'Processo excepcional de transferência entre categorias, seções ou grupos.' },
  { id: 'homologacao-lrm-aquaviario', title: 'Homologação do LRM',
    summary: 'Preparação documental para homologação do Livro de Registro do Mergulhador.' },
  { id: 'emissao-certificado-aquaviario', title: 'Emissão de certificado',
    summary: 'Requerimento de certificação DPC-1031, DPC-1032, DPC-1033 ou DPC-1034.' },
  { id: 'segunda-via-certificado-aquaviario', title: '2ª via de certificado',
    summary: 'Segunda via de certificado por dano, extravio, roubo ou furto.' },
  { id: 'revalidacao-certificado-aquaviario', title: 'Revalidação de certificado',
    summary: 'Revalidação de certificação profissional conforme a NORMAM-101.' },
];

export const PLANNED_AQUAVIARIO_SERVICES: readonly PlannedService[] = [
  {
    id: 'inscricao-inicial-cir-aquaviario',
    title: 'Inscrição inicial / emissão da CIR',
    summary: 'Preparação dos documentos aplicáveis à inscrição inicial e emissão da CIR.',
  },
  {
    id: 'segunda-via-cir-aquaviario',
    title: '2ª via da CIR',
    summary: 'Segunda via por dano, extravio, roubo ou furto, com declaração específica quando aplicável.',
  },
  {
    id: 'revalidacao-cir-aquaviario',
    title: 'Revalidação da CIR',
    summary: 'Preparação da documentação de apoio para revalidação da Caderneta de Inscrição e Registro.',
  },
  {
    id: 'transferencia-jurisdicao-aquaviario',
    title: 'Transferência de jurisdição',
    summary: 'Mudança da Organização Militar de jurisdição do aquaviário.',
  },
  {
    id: 'ascensao-categoria-aquaviario',
    title: 'Ascensão de categoria',
    summary: 'Preparação dos documentos do processo de ascensão profissional.',
  },
  {
    id: 'transferencia-categoria-grupo-aquaviario',
    title: 'Transferência de categoria ou grupo',
    summary: 'Processo de transferência entre categorias, seções ou grupos previstos na NORMAM-101.',
  },
  {
    id: 'homologacao-lrm-aquaviario',
    title: 'Homologação do LRM',
    summary: 'Homologação do Livro de Registro do Mergulhador para aquaviários do grupo de mergulhadores.',
  },
  {
    id: 'emissao-certificado-aquaviario',
    title: 'Emissão de certificado',
    summary: 'Requerimento de certificação para os modelos previstos na NORMAM-101.',
  },
  {
    id: 'segunda-via-certificado-aquaviario',
    title: '2ª via de certificado',
    summary: 'Segunda via de certificado profissional, com declaração de perda quando aplicável.',
  },
  {
    id: 'revalidacao-certificado-aquaviario',
    title: 'Revalidação de certificado',
    summary: 'Requerimento para revalidação de certificado profissional do aquaviário.',
  },
];

export const PLANNED_AMATEUR_SERVICES: readonly PlannedService[] = [
  {
    id: 'inscricao-exame-amador',
    title: 'Inscrição para exame',
    summary: 'Preenchimento do requerimento para inscrição nos exames de Arrais, Mestre ou Capitão.',
  },
  {
    id: 'renovacao-cha-amador',
    title: 'Renovação da CHA',
    summary: 'Preenchimento dos formulários de renovação para Arrais, Mestre ou Capitão, inclusive em caso de perda, roubo, furto ou dano da cédula.',
  },
  {
    id: 'emissao-cha-veleiro',
    title: 'Emissão de CHA de Veleiro',
    summary: 'Preenchimento do requerimento para emissão da habilitação de Veleiro.',
  },
  {
    id: 'concessao-cha-equivalencia',
    title: 'Concessão por equivalência profissional',
    summary: 'Requerimento de CHA de Arrais, Mestre ou Capitão por equivalência profissional.',
  },
  {
    id: 'renovacao-cha-agregacao-mta',
    title: 'Renovação com agregação de Motonauta',
    summary: 'Renovação da CHA com inclusão da categoria Motonauta.',
  },
];
