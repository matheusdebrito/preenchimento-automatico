export const WIZARD_STEPS = [
  { slug: 'servico', label: 'Serviço' },
  { slug: 'documentos', label: 'Documentos' },
  { slug: 'leitura', label: 'Leitura' },
  { slug: 'conferencia', label: 'Conferência' },
  { slug: 'download', label: 'Download' },
] as const;

export type WizardStepSlug = (typeof WIZARD_STEPS)[number]['slug'];

export const WIZARD_PATHS: Record<WizardStepSlug, string> = {
  servico: '/preencher/servico',
  documentos: '/preencher/documentos',
  leitura: '/preencher/leitura',
  conferencia: '/preencher/conferencia',
  download: '/preencher/download',
};

export function isWizardStepSlug(value: string): value is WizardStepSlug {
  return WIZARD_STEPS.some((step) => step.slug === value);
}
