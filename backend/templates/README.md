# Modelos oficiais em branco — catálogo independente

Os PDFs entram nesta pasta **por formulário e revisão**, não por serviço.

Estrutura obrigatória:

```text
backend/templates/<form-id>/<revisao-interna>/original.pdf
```

Exemplo ilustrativo: `backend/templates/bdmoto/v1/original.pdf`.
O identificador `v1` descreve uma revisão **interna** do catálogo, não a
versão oficial do documento. O registro `FormVersion` preserva separadamente
a revisão da Marinha quando conhecida.

O OpenCode deverá pesquisar normas e aplicabilidade antes de solicitar
arquivos, enviar ao usuário nome, finalidade, link oficial e caminho completo
na Fase 02 do `PROJECT_TRACKER.md` e aguardar a conferência humana. O download
só pode ser feito com autorização e fonte oficial comprovável. Os seis anexos
do piloto foram baixados em 26/10/2026, verificados e confirmados no portão
humano. Não baixar formulários de outros serviços antecipadamente.

Nunca adicionar aqui RG, CPF, fotos de clientes, OCR, PDFs preenchidos,
arquivos temporários ou testes com dados pessoais. Os PDFs originais devem
permanecer imutáveis e ser versionados somente após verificar origem e
condições de uso. Cada versão possui SHA-256 e mapeamento técnico próprio.
