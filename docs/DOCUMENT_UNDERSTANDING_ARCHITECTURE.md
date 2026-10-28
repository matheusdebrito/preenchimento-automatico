# Arquitetura de formulários e entendimento de documentos

## Decisão

A aplicação não define campos manualmente por serviço. O serviço compõe formulários e regras de processo; os campos necessários são derivados dos mapeamentos dos formulários selecionados.

A extração também não deve conhecer serviços. Um documento produz evidências de campos canônicos; o processo decide quais dessas evidências são aplicáveis aos formulários escolhidos.

Fluxo obrigatório:

```text
Serviço -> Formulários -> FormMapping -> campos canônicos
Upload -> OCR -> DocumentObservation -> conceitos semânticos multi-layout -> FieldEvidence
FieldEvidence -> FieldResolver -> revisão humana -> preenchimento dos formulários
```

## Responsabilidades

### Campo canônico

É a identidade semântica reutilizável, por exemplo `person.fullName`, `person.cpf`, `vessel.registration`. Não pertence a um serviço nem a um PDF específico.

### Formulário

`FormDefinition` e `FormVersion` representam o documento. `FormMapping.placements` é a fonte de verdade técnica dos campos que aquela versão precisa. Um serviço não deve duplicar essa lista.

### Serviço

`ServiceDefinition` contém workflow, perguntas, custo e documentos que podem auxiliar o processo. `ServiceForm` compõe versões de formulários e condições. O serviço não implementa regras de OCR.

### Família de documento e layouts

A unidade principal de entendimento é a família semântica, não a versão visual do documento.
Um mesmo extractor pode aceitar múltiplos layouts quando eles representam os mesmos conceitos.
Exemplos: TIE/TIEM antigo e digital compartilham conceitos de embarcação; CNH física e
digital podem compartilhar conceitos de identidade.

A classificação de layout pode existir para diagnóstico e para reduzir o espaço de busca de
regras exclusivas de uma variante, mas não deve ser pré-condição para extrair conceitos
compartilhados. Um erro ou ausência de classificação não pode inutilizar toda a extração:
classificação inconclusiva deve cair no catálogo multi-layout conservador.

No caso TIE/TIEM, marcadores estruturais fortes distinguem de forma opcional `digital` e
`legacy`. A variante digital habilita conceitos exclusivos como `AB / GT`, `BOCA / BREADTH`
e fabricante/marca/modelo bilíngue; a variante legacy habilita potência e nome do fabricante
do grid antigo. Inscrição, nome, ano, comprimento, atividade, tripulantes, passageiros, casco
e série do motor continuam conceitos compartilhados. Campos mascarados não podem atravessar
outros rótulos ou reutilizar números vizinhos.

O OCR não é treinado nem especializado por documento. PaddleOCR permanece um produtor
genérico de texto, confiança e geometria. A especialização vive na camada de conceitos
semânticos e aliases de rótulo.

### DocumentObservation

É a representação neutra da leitura do documento: páginas, linhas, confiança e geometria. PaddleOCR é um produtor dessa observação, mas PDFs digitais podem produzir a mesma estrutura diretamente da camada textual confiável do PDF. Regras de domínio não dependem da API específica do Paddle nem do produtor da observação.

Para PDFs de TIE, comprovante de residência e documento de venda, a aplicação pode tentar primeiro a camada textual com geometria. Essa rota rápida só é aceita quando há conteúdo textual suficiente; PDFs escaneados, vazios ou pobres caem automaticamente para PaddleOCR. Identidade permanece no Paddle até que a equivalência seja validada, preservando o fluxo real já homologado pelo usuário.

### DocumentExtractor

Conhece a semântica de uma família de documento e produz `FieldEvidence[]`. Não conhece
serviço nem formulário.

Campos repetidos entre layouts devem ser descritos como conceitos semânticos. Cada conceito
define o campo canônico, aliases conhecidos de rótulo, validador estrutural e normalização
opcional. A busca usa valor inline, relação à direita, relação abaixo e sequência próxima.

A mesma regra deve funcionar para layouts antigo, digital, bilíngue ou futuras pequenas
variações sempre que o significado do campo for o mesmo.

### FieldEvidence

Registra valor, campo canônico, documento, página, linhas utilizadas, confiança e método de
associação. É temporário e sujeito a revisão; nunca prova autenticidade.

A inspeção também pode produzir `FieldExtractionAssessment`:
- `FOUND`: um valor único e válido foi associado ao conceito;
- `NOT_FOUND`: não houve evidência suficiente;
- `AMBIGUOUS`: mais de um valor válido e divergente foi encontrado.

`NOT_FOUND` não significa que o campo não exista fisicamente no documento; pode significar
baixa qualidade de imagem, OCR insuficiente ou alias ainda não suportado.

### FieldResolver

Agrupa evidências por campo. Valores equivalentes podem reforçar a origem; valores divergentes geram conflito e não são escolhidos silenciosamente.

## Regras de evolução

1. Não adicionar novos documentos ao parser monolítico `suggestFields()`.
2. Novos documentos devem ganhar extractor próprio e testes sintéticos.
3. Coordenadas absolutas só podem ser pistas; preferir âncoras semânticas e relações espaciais.
4. OCR não inventa valores. Ausência, ambiguidade e conflito seguem para revisão manual.
5. Extratores não conhecem IDs de serviço.
6. Formulários não conhecem a origem do dado.
7. Serviços não duplicam listas de campos já presentes nos mapeamentos.
8. Evidência e dados extraídos permanecem temporários e não entram em analytics/logs.
9. Não exigir classificação de layout para extrair campos que compartilham a mesma semântica; classificação opcional pode restringir apenas regras exclusivas de uma variante.
10. Um novo layout deve preferencialmente adicionar aliases/testes ao conceito existente, não duplicar o extractor.
11. Classificação explícita só é necessária quando famílias diferentes possuem semântica incompatível ou quando variantes possuem campos exclusivos que aumentariam falso positivo se buscados globalmente.
12. Fallbacks sem âncora devem exigir formato forte e evidência de domínio; um identificador alfanumérico genérico nunca deve ser promovido a casco apenas por unicidade.
13. Perfis em `documentos/ancoras/*.json` são referência documental, não configuração executável. Somente aliases, direção e contexto explicitamente revisados podem ser promovidos para os conceitos canônicos; campos não mapeados são ignorados.

## Migração incremental

- Etapa 1: contratos, observação neutra, resolver e extractor de identidade.
- Etapa 2: retirar identidade do parser legado após regressões equivalentes.
- Etapa 3: consolidar campos compartilhados em conceitos semânticos multi-layout.
- Etapa 4: TIE/TIEM usam catálogo multi-layout; comprovante permanece extractor independente.
- Etapa 5: cadastrar aliases de CNH física/digital e CHA antiga/digital quando os layouts reais entrarem no conjunto de referência.
- Etapa 6: separar famílias somente onde houver semântica incompatível; migrar documento de venda e eliminar o parser legado quando não houver consumidores.

O parser legado pode existir durante a transição para tipos ainda não migrados, mas não pode receber novos tipos de documento.


## Perfis de âncoras de referência

Os JSONs em `documentos/ancoras/` ajudam a catalogar rótulos de layouts conhecidos, mas não
são carregados diretamente pelo runtime. A política de promoção seletiva, incluindo itens
aceitos e descartados, está em [ANCHOR_PROFILES_CURATED_USAGE.md](ANCHOR_PROFILES_CURATED_USAGE.md).
