export type TemplateGenerationErrorCode =
  | 'template_unapproved'
  | 'template_path_invalid'
  | 'template_not_found'
  | 'template_hash_mismatch'
  | 'template_invalid_pdf'
  | 'template_page_missing'
  | 'template_rotation_unsupported'
  | 'template_layout_invalid'
  | 'template_acroform_unsupported'
  | 'template_acroform_appearance_failed';

export class TemplateGenerationError extends Error {
  constructor(public readonly code: TemplateGenerationErrorCode) {
    super(code);
  }
}
