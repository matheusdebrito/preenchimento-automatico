# Análise documental com OpenAI

## Arquitetura vigente

A aplicação utiliza exclusivamente a OpenAI Responses API para interpretar documentos enviados no fluxo de preenchimento. Não existe serviço PaddleOCR, Tesseract ou extração local de texto para alimentar os formulários.

O backend envia os arquivos originais aceitos pelo upload:
- PDF como `input_file`;
- PNG/JPEG como `input_image`.

A chave `OPENAI_API_KEY` existe somente no backend. O frontend nunca recebe a chave.

## Fluxo

1. O usuário envia zero, um ou mais documentos. Uploads continuam opcionais.
2. O backend consulta os requisitos documentais do serviço selecionado.
3. Para cada documento, aplica a política `allowedFieldIds` e mantém somente campos presentes na revisão daquele serviço.
4. A Responses API recebe os arquivos originais, instruções de extração e schema JSON estrito.
5. Na mesma resposta, a OpenAI classifica identidades como RG/CIN/CNH e TIE/TIEM como digital/legado. Não existe chamada extra só para classificação.
6. O backend aplica uma segunda allow-list determinística pelo subtipo e valida novamente cada valor (CPF, datas, booleanos, escolhas e regras específicas).
7. `identityType` é derivado pelo backend. Na CIN, o CPF validado também é usado como número único da identidade; em RG/CNH o CPF nunca substitui o número de identidade.
8. O resolver associa evidências à origem documental e identifica conflitos.
9. O usuário revisa ou corrige todos os valores antes da geração.
10. O motor `fillPdf` usa somente os valores confirmados para preencher os modelos aprovados.

## Segurança e privacidade

- Enviar à OpenAI somente documentos com perfil de extração e campos aplicáveis ao serviço.
- Nunca enviar GRU, procuração ou outro arquivo sem campos explicitamente permitidos só para tentar extrair informação.
- Nunca confiar no texto retornado pelo modelo sem validação determinística no backend.
- Nunca aceitar campos fora do schema ou cuja origem não esteja autorizada.
- Campo ausente, ilegível, mascarado, ambíguo ou conflitante permanece sem sugestão ou exige revisão.
- TIE digital não é fonte de endereço legado de proprietário/coproprietário; TIE/TIEM legado pode fornecer esses campos quando estiverem explicitamente impressos.
- Quantidade de motores nunca é inferida apenas porque um motor aparece no documento.
- Usar `store: false` na chamada à Responses API.
- Não registrar arquivos, imagens, texto dos documentos, CPF, nomes ou valores extraídos em logs.
- Os arquivos permanecem no armazenamento temporário privado do job e são excluídos ao cancelar ou expirar.
- Como os arquivos são enviados a um provedor externo, a política de privacidade e os avisos ao usuário devem informar esse processamento.

## Configuração

No ambiente do backend:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini-2026-03-17
OPENAI_PROJECT_ID=
OPENAI_DOCUMENT_DETAIL=high
```

A chave deve ser fornecida pelo ambiente de implantação, nunca commitada. Sem chave válida, a análise documental retorna erro explícito; o usuário ainda pode continuar sem anexos e preencher manualmente.

## Testes e homologação

- Testes unitários do extrator usam respostas simuladas; não consomem créditos da API.
- CI não envia documentos reais nem depende de uma chave OpenAI.
- Antes de produção, executar testes controlados com documentos sintéticos e amostras autorizadas, medir precisão por campo/documento, latência, tokens e custo.
- Testar PDF digital, PDF escaneado, fotos, rotações, baixa resolução, documentos cortados, dados mascarados, múltiplos documentos e conflitos entre titular/comprador/vendedor.
- Verificar o PDF final visualmente: a extração correta não garante que o mapeamento do formulário esteja correto.
- Toda sugestão permanece sujeita à revisão humana.

## Limites

A OpenAI interpreta o conteúdo visual/textual do arquivo; ela não autentica documentos, não consulta a situação cadastral da embarcação na Marinha e não decide quais documentos são legalmente exigidos. Essas regras permanecem no catálogo e na revisão responsável.
