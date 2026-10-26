# Catálogo de formulários oficiais

**Status:** inventário inicial; nenhum PDF foi fornecido ou homologado nesta etapa.

## Objetivo e fonte de verdade

Cadastrar **modelos oficiais**, não criar um PDF diferente para cada serviço.
Cada modelo tem identificador, versão interna, norma, origem oficial, data da conferência,
hash SHA-256, caminho do arquivo original, tipo de PDF, campos semânticos e estado.
Um modelo pode pertencer a diversos serviços, sem duplicar o arquivo ou a lógica.
Não afirmar que um formulário é obrigatório sem verificar a norma vigente e as
orientações da Capitania relevante.

## Estados

- `IDENTIFIED`: localizado, ainda sem mapeamento confiável.
- `MAPPED`: campos identificados e mapeados; precisa de testes.
- `TESTED`: testes de geração e inspeção visual realizados.
- `APPROVED`: modelo, fontes, versão e revisão humana aprovados para uso.
- `OUTDATED`: substituído ou desatualizado; não gerar novos documentos.

## Inventário inicial

| ID proposto | Formulário | Norma | PDF oficial | Versão | Estado |
| --- | --- | --- | --- | --- | --- |
| `bdmoto` | Boletim de Dados de Moto Aquática (a confirmar aplicabilidade ao piloto) | NORMAM-212/DPC, conferir edição vigente | Pendente | Pendente | `IDENTIFIED` |

**O inventário não confirma obrigatoriedade** no serviço piloto. As hipóteses
de exigência, outros anexos e formulários dependem da conferência oficial.
Não disponibilizar geração ou simular aprovação enquanto houver pendências.

## Checklist de cadastramento

1. Obter PDF na fonte oficial e registrar URL, data de consulta, versão e SHA-256.
2. Confirmar norma vigente, jurisdição, serviço e condições que exigem o formulário.
3. Inspecionar dimensões/páginas e descobrir AcroForm, PDF estático ou híbrido.
4. Definir campos semânticos reutilizáveis (ex.: `person.fullName`) e validar formatos.
5. Mapear o campo para nome de AcroForm ou coordenadas por página (sem alterar original).
6. Gerar PDF com dados **fictícios**, incluindo textos longos, acentos e páginas múltiplas.
7. Renderizar e conferir visualmente cada página, integridade e espaço para assinatura.
8. Aprovar a versão revisada; ao receber novo modelo, criar nova versão e revalidar.

## Separação de arquivos

- PDFs oficiais versionados: `backend/templates/` (quando efetivamente obtidos).
- Contratos e definições do catálogo: `backend/src/modules/catalog/`.
- Futuros mapeamentos de PDF: módulo de PDF separado das regras de serviços.
- Arquivos temporários de usuários: diretório privado, fora do repositório, fora
  do webroot, com política de expiração e limpeza.
- Nunca versionar documentos pessoais ou PDFs preenchidos com dados reais.

## Campos semânticos iniciais

Os IDs `person.fullName`, `person.cpf`, `person.address` e
`vessel.hullId` são **exemplos técnicos**, não uma lista validada de
campos obrigatórios para o BDMOTO. Devem ser revisados com o PDF oficial.

## Política para alterações

Toda atualização de PDF requer novo hash, revalidação do mapeamento,
testes de regressão e revisão humana; nunca mudar silenciosamente o
arquivo de uma versão já aprovada.
