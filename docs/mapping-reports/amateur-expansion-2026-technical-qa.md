# Expansão de serviços de amadores - QA técnico - 29/10/2026

## Escopo

Foram revisados três serviços adicionais:

1. Emissão de CHA de Veleiro;
2. Concessão de CHA por correspondência/equivalência profissional;
3. Renovação de CHA de ARA/MSA/CPA com agregação da categoria de Motonauta.

A aplicação continua limitada a **preencher formulários**. Documentos exigidos pela
Marinha para protocolo não são tratados como bloqueios do gerador; uploads existem apenas
quando podem fornecer dados úteis para preenchimento.

## Emissão de CHA de Veleiro

Base: NORMAM-211/DPC, item 5.5.2.

O requerimento é o Anexo 5-H. O serviço reutiliza o PDF 5-H já versionado e aprovado,
marca a opção 2 - EMISSÃO/RENOVAÇÃO e registra na descrição do pedido
"Emissão de CHA de Veleiro".

O Anexo 5-G é uma declaração emitida pela marina, clube, entidade desportiva náutica ou
estabelecimento de treinamento que ministrou o curso. Ele não é gerado pela aplicação para
o candidato e, portanto, não integra o pacote automático deste serviço.

Estado: AVAILABLE.

## Concessão por equivalência profissional

Base: NORMAM-211/DPC, item 5.5.3.

O procedimento usa o Anexo 5-H. O serviço marca a opção 1 - CONCESSÃO DE CHA POR
CORRESPONDÊNCIA/EQUIVALÊNCIA PROFISSIONAL e escreve na descrição a categoria
selecionada (Arrais-Amador, Mestre-Amador ou Capitão-Amador).

A posição da opção 1 foi revisada visualmente em amostra sintética local com o PDF
versionado do 5-H.

Estado: AVAILABLE.

## Renovação com agregação de Motonauta

Bases:
- NORMAM-211/DPC, Anexo 5-H, opção 3;
- NORMAM-212/DPC, artigo 3.4;
- NORMAM-212/DPC, Anexo 3-A.

O 5-H exige a opção 3 - RENOVAÇÃO DE CHA DE ARA, MSA OU CPA COM AGREGAÇÃO DA
CATEGORIA DE MTA. A NORMAM-212 também exige o requerimento 3-A e nele a declaração
de que o requerente conduz ou já conduziu moto aquática.

A posição da opção 3 do 5-H foi revisada visualmente. O Anexo 3-A foi extraído localmente
das páginas PDF 86-87 da NORMAM-212/DPC 2026 e recebeu mapping DRAFT, mas ainda não
está versionado no repositório.

Arquivo local preparado:
- NORMAM-212_Anexo-3-A_Requerimento-Motonauta.pdf
- SHA-256: 43288872ACFFA54A36A2292A21ED3029E33809CD4B444741A3A0C2C1DCAFEF52

Estado: DRAFT até o PDF 3-A entrar no caminho canônico, seu hash ser confirmado e a
geração pelo motor real ser revisada.

## Anexo 5-G

Também foi extraído localmente para conferência documental:

- NORMAM-211_Anexo-5-G_Declaracao-Curso-Veleiro.pdf
- SHA-256: 310D8A3A1E7A566B1C0979A2D54373545D1441B9867446BDB97DDCB72EF39FCF

Ele permanece fora do pacote automático porque a declaração deve ser emitida pela entidade
responsável pelo curso, não pelo candidato.

## QA do 5-H

O mapping do 5-H passou para revisão v2, mantendo status APPROVED. Foram revisadas
visualmente as posições das opções:

- 1 - equivalência profissional;
- 2 - emissão/renovação;
- 3 - renovação com agregação MTA;

Nenhuma opção de marina/credenciamento foi promovida como serviço de amador pessoa
física.
