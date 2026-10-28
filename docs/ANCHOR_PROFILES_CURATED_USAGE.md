# Uso curado dos perfis de âncoras

Os arquivos de `documentos/ancoras/*.json` são referências de conhecimento documental.
Eles **não são carregados diretamente em produção** e não têm autoridade para criar campos,
mudar o domínio ou alterar regras de segurança.

## Regra

Somente conhecimento explicitamente revisado pode ser promovido para a camada
`document-understanding`.

Fluxo:

```text
JSON de referência
  -> revisão
  -> allowlist de conceitos já existentes
  -> aliases/direção úteis
  -> validadores do código
  -> FieldEvidence
```

Os IDs canônicos e os validadores continuam definidos pela aplicação.

## Aproveitado nesta entrega

### RG / CIN / CNH

- `NOME / NAME` e `NAME AND SURNAME` como âncoras do titular;
- preferência por valor abaixo nos layouts CIN/CNH quando aplicável;
- `DATA DE EMISSÃO`, `DATA DE EXPEDIÇÃO` e `ISSUING DATE` -> `person.issueDate` / `seller.issueDate`;
- `NACIONALIDADE / NATIONALITY` -> campos canônicos de nacionalidade;
- `NATURALIDADE / PLACE OF BIRTH`, `NATURAL DE` -> campos canônicos de naturalidade;
- `ÓRGÃO EXPEDIDOR / CARD ISSUER` como alias do emissor;
- CPF continua dependente de validação matemática e unicidade.

CIN é tratada como documento da família de identidade, mas o CPF da CIN **não é copiado
automaticamente para `person.identity`**. A aplicação não inventa um número de RG separado
quando o documento não o apresenta.

### TIE / TIEM

- aliases bilíngues de número de inscrição;
- aliases bilíngues de ano de construção, comprimento e número do casco;
- `ATIVIDADE / SERVIÇO`;
- `NÚMERO DE SÉRIE DO CASCO/CHASSIS`;
- preferências de direção abaixo/direita conforme os perfis de referência;
- aliases já compatíveis de motor 1, tripulantes e passageiros continuam no extractor.

## Deliberadamente ignorado

- fuzzy matching global e `fuzzyThreshold=0.88`;
- motores 2, 3 e 4;
- tipo sanguíneo, doação de órgãos, NIS, PIS/PASEP, CNS e outros dados opcionais da CIN;
- categoria/número da CNH enquanto não forem necessários pelos formulários ativos;
- proprietário do TIE/TIEM como comprador;
- campos financeiros/hipoteca/alienação do TIEM;
- campos sem correspondência no catálogo canônico atual;
- CIR, que permanece parcialmente confirmado;
- `anchorChain` de proprietário/copropietário até existir necessidade de domínio e teste específico.

## Por que não carregar JSON diretamente

Carregar os perfis diretamente em runtime faria uma alteração documental mudar o
comportamento do OCR sem passar por revisão de domínio, testes e segurança. Isso também
permitiria reintroduzir campos já removidos do MVP, como múltiplos motores.

Os JSONs permanecem valiosos como fonte de aliases e conhecimento de layouts, mas a promoção
para produção é intencional e testada.
