import type { CatalogDefinition } from './contracts.js';
import { additionalFields } from './fields.js';
import { draftMappings } from './draft-mappings.js';
import { normam211Mappings } from './normam211-mappings.js';
import {
  APPLICANT_IDENTITY_FIELDS,
  RESIDENCE_PROOF_FIELDS,
  SALE_DOCUMENT_FIELDS,
  SELLER_IDENTITY_FIELDS,
  TIE_FIELDS,
} from './document-field-policies.js';
import {
  vesselForms,
  vesselVersions,
  vesselServices,
  vesselServiceForms,
} from './vessel-services.js';

/**
 * This is configuration, not evidence of applicable official forms.
 * Keep the pilot in DRAFT until all required PDF versions are verified,
 * mapped, visually reviewed and associated with the service.
 * Frontend demo data remains separate; no document is generated here.
 */
export const catalog: CatalogDefinition = {
  fields: [
    { id: 'person.fullName', label: 'Nome completo', valueKind: 'text' },
    { id: 'person.cpf', label: 'CPF', valueKind: 'text', validationRuleId: 'cpf' },
    { id: 'person.address', label: 'Endereço', valueKind: 'text' },
    { id: 'vessel.hullId', label: 'Identificação do casco', valueKind: 'text' },
    ...additionalFields,
  ],
  forms: [
    ...vesselForms,
    {
      id: 'requerimento-ma',
      name: 'Requerimento para inscrição ou transferência de propriedade e/ou jurisdição de moto aquática ou do seu proprietário',
      description: 'Anexo 2-A da NORMAM-212/DPC 2026.',
    },
    {
      id: 'bdmoto',
      name: 'Boletim de Dados de Moto Aquática (BDMOTO)',
      description: 'Anexo 2-B da NORMAM-212/DPC 2026.',
    },
    {
      id: 'autorizacao-transferencia-ma',
      name: 'Autorização de Transferência de Propriedade',
      description: 'Anexo 2-D da NORMAM-212/DPC 2026.',
    },
    {
      id: 'comunicacao-transferencia-ma',
      name: 'Comunicação de Transferência de Propriedade de Moto Aquática',
      description: 'Anexo 2-E da NORMAM-212/DPC 2026.',
    },
    {
      id: 'declaracao-perda-tie-ma',
      name: 'Declaração de Perda, Roubo ou Extravio de Título de Inscrição de Embarcação',
      description: 'Anexo 2-C da NORMAM-212/DPC 2026.',
    },
    {
      id: 'declaracao-residencia-ma',
      name: 'Declaração de Residência',
      description: 'Anexo 1-C da NORMAM-212/DPC 2026.',
    },
  ],
  versions: [
    ...vesselVersions,
    {
      id: 'requerimento-ma-v1',
      formId: 'requerimento-ma',
      revision: 'v1',
      officialRevision: null,
      regulation: 'NORMAM-212/DPC 2026, Anexo 2-A',
      sourceUrl: 'https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-212(REQUERIMENTO%20EMBARCA%C3%87%C3%83O).pdf',
      verifiedAt: '2026-10-26',
      sha256: '0E0CE9A72BE328C722D0D8C6CCB5C028E1B0881119D8A8A743BC52AA88CBFB5E',
      templatePath: 'backend/templates/requerimento-ma/v1/original.pdf',
      pdfKind: 'STATIC',
      status: 'VERIFIED',
    },
    {
      id: 'bdmoto-v1',
      formId: 'bdmoto',
      revision: 'v1',
      officialRevision: null,
      regulation: 'NORMAM-212/DPC 2026, Anexo 2-B',
      sourceUrl: 'https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-212(BDMOTO).pdf',
      verifiedAt: '2026-10-26',
      sha256: 'BBCC6E0FA261BE82C30FBD280697E83E750DA82B5CFB88647BA27748F0973318',
      templatePath: 'backend/templates/bdmoto/v1/original.pdf',
      pdfKind: 'STATIC',
      status: 'VERIFIED',
    },
    {
      // Extraído do PDF oficial da NORMAM-212/DPC 2026, páginas 81 e 82.
      id: 'autorizacao-transferencia-ma-v1',
      formId: 'autorizacao-transferencia-ma',
      revision: 'v1',
      officialRevision: null,
      regulation: 'NORMAM-212/DPC 2026, Anexo 2-D',
      sourceUrl: 'https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-212.pdf',
      verifiedAt: '2026-10-26',
      sha256: '1E3855A0F6151481032E01823EE38985D69BAB68606A33C201ACEF0E1D2B8ED3',
      templatePath: 'backend/templates/autorizacao-transferencia-ma/v1/original.pdf',
      pdfKind: 'STATIC',
      status: 'VERIFIED',
    },
    {
      // Extraído do PDF oficial da NORMAM-212/DPC 2026, página 84.
      // O PDF standalone da CPRS é o antigo anexo 2-F e foi descartado.
      id: 'comunicacao-transferencia-ma-v1',
      formId: 'comunicacao-transferencia-ma',
      revision: 'v1',
      officialRevision: null,
      regulation: 'NORMAM-212/DPC 2026, Anexo 2-E',
      sourceUrl: 'https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-212.pdf',
      verifiedAt: '2026-10-26',
      sha256: '3CE8A920F8E77A10105973B1B0CF74CD7A48A34B3F449496B2CC9D89E97B0419',
      templatePath: 'backend/templates/comunicacao-transferencia-ma/v1/original.pdf',
      pdfKind: 'STATIC',
      status: 'VERIFIED',
    },
    {
      id: 'declaracao-perda-tie-ma-v1',
      formId: 'declaracao-perda-tie-ma',
      revision: 'v1',
      officialRevision: null,
      regulation: 'NORMAM-212/DPC 2026, Anexo 2-C',
      sourceUrl: 'https://assets.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/Declara%C3%A7%C3%A3o%20de%20extarvio%20MA%20Anexo-2C.pdf',
      verifiedAt: '2026-10-26',
      sha256: 'A0F2464E4743AA5C60813066C16524FE2B8FDA2E67F78A6FF6472120B9BCE3EB',
      templatePath: 'backend/templates/declaracao-perda-tie-ma/v1/original.pdf',
      pdfKind: 'STATIC',
      status: 'VERIFIED',
    },
    {
      id: 'declaracao-residencia-ma-v1',
      formId: 'declaracao-residencia-ma',
      revision: 'v1',
      officialRevision: null,
      regulation: 'NORMAM-212/DPC 2026, Anexo 1-C',
      sourceUrl: 'https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-212(DECLARA%C3%87%C3%83O%20DE%20RESIDENCIA).pdf',
      verifiedAt: '2026-10-26',
      sha256: 'F75612D57F5D6C884D43107F17F0FB3F52B43B5A34BFAA351C6E717C26EA5782',
      templatePath: 'backend/templates/declaracao-residencia-ma/v1/original.pdf',
      pdfKind: 'STATIC',
      status: 'VERIFIED',
    },
  ],
  mappings: [...draftMappings, ...normam211Mappings],
  services: [
    {
      id: 'transferencia-moto-aquatica',
      title: 'Transferência de moto aquática',
      description: 'Piloto de transferência de propriedade de moto aquática. '
        + 'Não inclui transferência de jurisdição, emissão de TIE ou protocolo oficial.',
      creditCost: 1,
      status: 'DRAFT',
      questions: [
        { id: 'tieSituation', label: 'Situação do TIE atual', options: ['regular', 'extraviado'] },
        { id: 'transferAuthorization', label: 'A autorização de transferência já consta no TIE?',
          options: ['consta_tie', 'anexo_2d'] },
        { id: 'sellerCommunication', label: 'Deseja preparar a comunicação opcional do vendedor?',
          options: ['sim', 'nao'] },
        { id: 'residenceProof', label: 'Comprovação de residência do comprador',
          options: ['comprovante', 'declaracao_1c'] },
        { id: 'coOwner', label: 'Existe coproprietário na moto aquática?',
          options: ['sim', 'nao'] },
        { id: 'representative', label: 'O processo será feito por procurador?',
          options: ['sim', 'nao'] },
      ],
      documentRequirements: [
        // Source documents help OCR, but are NEVER prerequisites for filling PDF fields.
        // The user can provide a single photo, several files or type everything.
        { id: 'buyer-identity', label: 'Identidade do comprador', required: false,
          extraction: {
            documentType: 'identity',
            subjectRole: 'person',
            allowedFieldIds: APPLICANT_IDENTITY_FIELDS,
          } },
        { id: 'seller-identity', label: 'Identidade do vendedor', required: false,
          extraction: {
            documentType: 'identity',
            subjectRole: 'seller',
            allowedFieldIds: SELLER_IDENTITY_FIELDS,
          } },
        { id: 'tie', label: 'Título de inscrição da moto aquática',
          description: 'Envie se disponível. Se foi extraviado, informe a situação na etapa anterior.',
          required: false, extraction: {
            documentType: 'tie',
            subjectRole: 'vessel',
            allowedFieldIds: TIE_FIELDS,
          } },
        { id: 'residence-proof', label: 'Comprovante de residência',
          required: false, extraction: {
            documentType: 'residence-proof',
            subjectRole: 'person',
            allowedFieldIds: RESIDENCE_PROOF_FIELDS,
          },
          conditions: [{ questionId: 'residenceProof', equals: 'comprovante' }] },
        { id: 'sale-document', label: 'Dados da venda ou nota fiscal',
          description: 'Documento de origem para auxiliar na conferência dos dados da venda.',
          required: false, extraction: {
            documentType: 'sale-document',
            subjectRole: 'person',
            allowedFieldIds: SALE_DOCUMENT_FIELDS,
          } },
        { id: 'power-of-attorney', label: 'Procuração e identificação do representante',
          required: false, conditions: [{ questionId: 'representative', equals: 'sim' }] },
        { id: 'gru-receipt', label: 'Comprovante de pagamento da GRU',
          description: 'Exigência para o processo oficial; não é cobrado nem emitido neste sistema.',
          required: false },
      ],
    },
    ...vesselServices,
  ],
  serviceForms: [...vesselServiceForms],
};
