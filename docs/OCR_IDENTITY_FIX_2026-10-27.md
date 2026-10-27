# Correção de extração do nome — 27/10/2026

## Estado e escopo

Implementação em `backend/src/modules/jobs/identity-ocr.ts`, integrada em `ocr.ts`. Substitui o caminho antigo de leitura de identidades descrito no README e no histórico de `OCR_EXTRACTION_RULES.md`: não se usa mais a caixa fixa x=260–320/y=580–700 nem a simples preferência por uma leitura que tenha qualquer nome plausível. Não altera rotas, autenticação, créditos, formulários ou o requisito de revisão humana.

## Comportamento atual

1. Decodificar apenas JPEG/PNG, respeitar orientação EXIF, remover transparência e limitar o lado maior a 2400 pixels, sem ampliar imagens pequenas. Usar diretório temporário privado.
2. Usar detecção de orientação do Tesseract (OSD) e, quando não houver rótulo de nome utilizável, tentativas limitadas em 0/90/180/270 graus. OSD é pista, não prova.
3. Ler a mesma imagem orientada em PSM 11 e PSM 6, com saída TSV. Associar o rótulo explícito NOME de uma leitura à linha correspondente da outra usando coordenadas relativas. O rótulo pode estar na mesma linha ou acima do valor. Variações limitadas N0ME/NOM3 são aceitas na detecção espacial.
4. Não descartar palavras de baixa confiança para produzir um nome artificialmente curto. Exigir mínimos heurísticos por palavra e por candidato; rejeitar candidatos fortes divergentes. Esses números não são percentuais de precisão.
5. Não atravessar FILIAÇÃO para buscar nomes; uma leitura que identifica NOME DA MÃE/DO PAI/SOCIAL veta o rótulo incompleto da outra. Sem evidência de rótulo, não adivinhar o titular.
6. Manter uma leitura para os demais campos, retirar nomes não validados e adicionar apenas o candidato espacial aceito. Todo resultado continua `REVIEW_REQUIRED`. `name_recognized` significa candidato aceito, não identidade autenticada nem garantia de transcrição.

## Limites e privacidade

Subprocessos usam `execFile`, sem shell e sem credenciais do banco. Tesseract mantém saída máxima de 256 KiB; TSV tem teto de 3000 linhas; temporários normalizados têm teto individual de 16 MiB. O processamento de uma imagem tem orçamento de 55 segundos e etapas limitadas, com limpeza em `finally`, inclusive após falha. Mantêm-se limites de uploads, concorrência e rasterização do projeto.

ImageMagick recebe decodificador raster explícito e limites de cache/threads. Isso não substitui sandbox do processo, limites reais de RAM/CPU, fuzzing ou validação sob carga. Nenhum texto OCR, imagem ou valor pessoal foi adicionado aos testes, relatórios públicos ou código desta alteração. O documento privado utilizado para reproduzir a falha não é fixture de CI.

## Evidências locais

Ambiente Linux: Node 22.16.0, Tesseract 5.5.0, ImageMagick e português/OSD instalados. Foram executados os 18 testes de associação/limites e os 3 testes de integração sintética: **21 aprovados**. Para executar localmente neste ambiente restrito, os testes TypeScript foram transpilados e somente o import do runner Vitest foi adaptado para `node:test`; o algoritmo testado não foi substituído. Também houve verificação TypeScript estrita isolada, com tipos locais para dependências não instaladas. Isso não equivale ao `npm ci`, lint, typecheck e build completos do repositório.

Na imagem anexada pelo usuário, o núcleo corrigido recuperou o nome completo comparado com referência visual privada e retornou o CPF nas quatro orientações ortogonais. Foram conferidos `name_recognized` e ausência de temporários remanescentes. Isso valida a reprodução específica, não todo modelo de RG, não toda resolução e não o fluxo completo no navegador.

## CI e uso

O CI de pull request executa os comandos reais com Node 24, PostgreSQL, Tesseract/OSD e ImageMagick. Conferir a execução do commit atual antes de afirmar aprovação integral. Novos testes de integração são ativados por `DATABASE_TEST_URL` ou `OCR_INTEGRATION_TESTS=1`.

Após trazer esta alteração para sua branch local, é necessário **um build inicial da imagem da API**, pois foram adicionados ImageMagick, seu decodificador JPEG e o modelo OSD:

```powershell
docker compose build api
```

Depois, o testador local fornecido separadamente pode importar `backend/src` diretamente dessa imagem, sem rebuild após cada mudança TypeScript. Não use valores reais em relatórios compartilhados; prefira sua saída padrão com valores ocultos. Alterações futuras em ferramentas/dependências continuam exigindo novo build.

Para o fluxo normal da aplicação, recrie a API após construir a imagem. Inicie um novo job; processos antigos em REVIEW não executam a nova extração automaticamente. Os mapeamentos continuam DRAFT, e a homologação de produção permanece pendente.

## Pendências

Validar um corpus sintético amplo com reflexos, desfoque, perspectiva, nomes quebrados em várias linhas e modelos variados. Calibrar limites com métricas de falso positivo/negativo. Conferir browser/Windows/Docker local do usuário, sandbox de decodificadores e carga. Não há garantia de extração total.
