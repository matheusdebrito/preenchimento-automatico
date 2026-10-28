# OCR Anchors - Marinha + Identidade + CNH (v2)

Arquivos:
- tiem_antigo.json
- tie_digital.json
- cha_digital.json
- cir.json
- rg_antigo_generic.json
- cin_fisica.json
- cin_digital.json
- cnh_fisica.json
- cnh_digital.json

Princípios:
1. Âncoras confirmadas em documentos/modelos reais ou fontes oficiais sempre que possível.
2. Matching tolerante (case/acentos/espaços + fuzzy matching).
3. Extração por geometria relativa, não por coordenadas absolutas.
4. Validadores devem confirmar CPF, datas, UF, nº de registro etc.
5. O RG antigo NÃO tinha um layout nacional único. O arquivo rg_antigo_generic.json contém apenas rótulos comuns; o ideal é criar variantes por UF conforme sua base real.
6. CIR: a estrutura de caderneta e a existência da Etiqueta de Dados Pessoais estão confirmadas pela Marinha; alguns rótulos pessoais vieram de formulário oficial de 2ª via, então permanecem com confidence=medium até validação em foto legível da etiqueta real.
7. TIE digital e CHA digital foram atualizados com modelos/documentos reais encontrados na web.

Sugestão de uso:
- Primeiro classifique o documento.
- Carregue o JSON da variante.
- Localize a âncora com fuzzy matching.
- Procure o valor por posição relativa.
- Valide o formato e gere confidence.
- Se confidence baixa, retorne REVIEW.
