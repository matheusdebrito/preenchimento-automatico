import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, FileCheck2, MapPin, Ship, UserRound, Wallet } from 'lucide-react';

export type FieldStatus = 'confirmado' | 'revisar' | 'nao_encontrado';

export interface DocumentRequirement {
  id: string;
  title: string;
  description: string;
}

/**
 * Lista ilustrativa. Os requisitos oficiais do serviço piloto dependem de
 * confirmação normativa e serão carregados do catálogo versionado.
 */
export const DEMO_DOCUMENT_REQUIREMENTS: readonly DocumentRequirement[] = [
  {
    id: 'identidade',
    title: 'Documento de identidade',
    description: 'RG, CNH ou outro documento oficial com foto.',
  },
  {
    id: 'tie',
    title: 'TIE da embarcação',
    description: 'Título de Inscrição de Embarcação (TIE).',
  },
  {
    id: 'comprovante',
    title: 'Comprovante de residência',
    description: 'Conta recente com o endereço legível.',
  },
];

export const DEMO_REQUIREMENTS_NOTE =
  'Lista ilustrativa de demonstração. A lista oficial será exibida a partir da configuração versionada do serviço.';

export interface ReviewFieldDefinition {
  id: string;
  label: string;
  value: string;
  status: FieldStatus;
  source: string;
  inputMode?: 'text' | 'numeric';
}

export interface ReviewSectionDefinition {
  id: string;
  title: string;
  icon: LucideIcon;
  fields: readonly ReviewFieldDefinition[];
}

export const DEMO_REVIEW_SECTIONS: readonly ReviewSectionDefinition[] = [
  {
    id: 'pessoa',
    title: 'Pessoa',
    icon: UserRound,
    fields: [
      {
        id: 'nome',
        label: 'Nome completo',
        value: 'Maria Exemplo da Silva',
        status: 'revisar',
        source: 'Origem: documento de identidade · p. 1',
      },
      {
        id: 'cpf',
        label: 'CPF',
        value: '000.000.000-00',
        status: 'revisar',
        source: 'Origem: documento de identidade · p. 1',
        inputMode: 'numeric',
      },
    ],
  },
  {
    id: 'endereco',
    title: 'Endereço',
    icon: MapPin,
    fields: [
      {
        id: 'logradouro',
        label: 'Logradouro e número',
        value: 'Rua Exemplo, 100',
        status: 'confirmado',
        source: 'Origem: comprovante de residência · p. 1',
      },
      {
        id: 'cidade',
        label: 'Cidade / UF',
        value: 'Cidade Exemplo / SC',
        status: 'confirmado',
        source: 'Origem: comprovante de residência · p. 1',
      },
      {
        id: 'cep',
        label: 'CEP',
        value: '',
        status: 'nao_encontrado',
        source: 'Ainda não encontrado nos documentos',
        inputMode: 'numeric',
      },
    ],
  },
  {
    id: 'embarcacao',
    title: 'Embarcação',
    icon: Ship,
    fields: [
      {
        id: 'nome-embarcacao',
        label: 'Nome da embarcação',
        value: 'Exemplo I',
        status: 'confirmado',
        source: 'Origem: TIE · p. 1',
      },
      {
        id: 'casco',
        label: 'Número de casco',
        value: 'BR-EXEMPLO-0001',
        status: 'revisar',
        source: 'Origem: TIE · p. 1',
      },
      {
        id: 'motor',
        label: 'Número do motor',
        value: '',
        status: 'nao_encontrado',
        source: 'Ainda não encontrado nos documentos',
      },
    ],
  },
];

export const DEMO_INITIAL_REVIEW_VALUES: Readonly<Record<string, string>> = Object.fromEntries(
  DEMO_REVIEW_SECTIONS.flatMap((section) =>
    section.fields.map((field) => [field.id, field.value] as const),
  ),
);

export const DEMO_CREDIT_BALANCE = 3;

export type CreditMovementKind = 'grant' | 'consume' | 'refund' | 'adjust';

export interface CreditMovement {
  id: string;
  kind: CreditMovementKind;
  label: string;
  date: string;
  amount: number;
  reference: string;
  icon: LucideIcon;
}

export const DEMO_CREDIT_HISTORY: readonly CreditMovement[] = [
  {
    id: 'mov-1',
    kind: 'grant',
    label: 'Concessão de teste',
    date: '2026-10-20T12:00:00-03:00',
    amount: 3,
    reference: 'TESTE-0001',
    icon: Wallet,
  },
  {
    id: 'mov-2',
    kind: 'consume',
    label: 'Uso em um processo',
    date: '2026-10-22T12:00:00-03:00',
    amount: -1,
    reference: 'PROCESSO-DEMO-001',
    icon: FileCheck2,
  },
  {
    id: 'mov-3',
    kind: 'refund',
    label: 'Estorno',
    date: '2026-10-24T12:00:00-03:00',
    amount: 1,
    reference: 'PROCESSO-DEMO-002',
    icon: CheckCircle2,
  },
];

export interface CreditProduct {
  id: string;
  title: string;
  description: string;
  detail: string;
}

export const DEMO_CREDIT_PRODUCTS: readonly CreditProduct[] = [
  {
    id: 'avulso',
    title: 'Crédito avulso',
    description: 'Para quem precisa preencher um processo específico.',
    detail: 'Sem mensalidade ou renovação automática.',
  },
  {
    id: 'pacote',
    title: 'Pacote pré-pago',
    description: 'Para quem tem mais de um processo para preencher.',
    detail: 'Créditos comprados de uma vez, sem assinatura.',
  },
];

export const DEMO_FORM_SLOT = {
  id: 'formulario-servico',
  name: 'Formulário do serviço',
  description:
    'O modelo oficial será listado aqui depois da confirmação normativa e da integração com o gerador de PDFs.',
} as const;
