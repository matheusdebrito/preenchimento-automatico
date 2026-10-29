# Auditoria normativa NORMAM-211/DPC e NORMAM-212/DPC - 29/10/2026

## Fontes usadas

Esta auditoria usa como fonte primária as duas publicações oficiais de 2026 fornecidas pelo
responsável pelo produto:

- NORMAM-211/DPC - Normas da Autoridade Marítima para Atividades de Esporte e Recreio;
- NORMAM-212/DPC - Normas da Autoridade Marítima para Motos Aquáticas e Motonautas.

Quando uma referência interna da norma diverge do sumário/anexo efetivamente publicado,
o projeto identifica o formulário pelo **título e conteúdo do anexo**, registra a divergência
e não altera silenciosamente a norma.

## Correções confirmadas na NORMAM-211

### Anexos usados pelo produto

| Anexo | Título oficial no PDF fornecido | Estado no projeto |
| --- | --- | --- |
| 2-A | Boletim de Atualização de Embarcações (BADE) | existente |
| 2-B | Boletim Simplificado de Atualização de Dados de Embarcação (BSADE) | existente |
| 2-C | Requerimento de Serviços para Regularização de Embarcações | existente |
| 2-G | Declaração de Residência | existente |
| 2-H | Declaração de Perda/Extravio de Documento | existente |
| 2-I | Comunicação de Transferência de Propriedade | existente |
| 2-K | Autorização de Transferência de Propriedade | existente |
| 3-C | Termo de Responsabilidade de Construção/Alteração | PDF corrigido; remapeamento pendente |
| 3-D | Termo de Responsabilidade para Realização de Prova de Máquinas/Navegação | fora dos fluxos atuais |

O antigo PDF/mapeamento catalogado como 3-C correspondia a outro termo e não pode ser
reutilizado. A versão corrigida do 3-C foi recolocada no repositório, mas permanece
`IDENTIFIED/DRAFT` até validar os bytes, refazer as coordenadas e repetir a revisão visual.

### BADE x BSADE

A regra anterior `até 12 m -> BSADE` estava incorreta.

- embarcação miúda (até 6 m): BSADE;
- embarcação de pequeno porte (mais de 6 m até 12 m): BADE;
- embarcação de médio porte (mais de 12 m e menor que 24 m): BADE.

O catálogo agora preserva as três faixas para que regras específicas de médio porte possam
continuar bloqueadas sem preencher o formulário errado.

### Inscrição

- até 6 m: Requerimento 2-C + BSADE;
- mais de 6 m até 12 m: Requerimento 2-C + BADE;
- mais de 12 m e menor que 24 m: Requerimento + BADE, com regras adicionais de médio
  porte; o 3-C é aplicável nos casos de dispensa da vistoria inicial previstos na norma.

Por isso a faixa acima de 12 m permanece bloqueada até o 3-C corrigido ser remapeado e a
condição normativa ser modelada.

### Transferência de propriedade

A seção 2.11.1 exige Requerimento, TIE (ou 2-H quando aplicável), Autorização de
Transferência, BADE/BSADE, além dos documentos comprobatórios. O 3-C **não faz parte
do pacote padrão de transferência** e foi removido desse fluxo.

A publicação contém uma referência textual a “anexo 2-L”, mas o sumário e o próprio
formulário publicado identificam a Autorização de Transferência como **Anexo 2-K**. O
projeto mantém 2-K e registra a inconsistência.

### Transferência de jurisdição

Usa Requerimento 2-C, BADE/BSADE, TIE ou 2-H quando aplicável e documentação de
suporte. Não usa 3-C como formulário padrão.

### Comunicação de venda

A NORMAM-211 determina a apresentação da Comunicação de Transferência (2-I) acompanhada
de cópia da Autorização de Transferência (2-K). O serviço foi corrigido para preparar os dois
formulários. Na NORMAM-212, o equivalente é 2-E + 2-D.

### Renovação e perda/extravio do TIE

A renovação usa Requerimento 2-C e novo BADE/BSADE apenas quando houve alteração de
características.

Com o TIE digital, perda/roubo/extravio não cria uma “segunda via” autônoma: o documento
pode ser visualizado/reimpresso pelo Gov.br. Quando se trata do modelo antigo perdido,
roubado ou extraviado, a norma direciona para **renovação**. O ID interno legado foi
preservado para compatibilidade, mas o título e a ação do formulário foram corrigidos.

### Alteração de dados/características e motor

A seção 2.12 usa Requerimento 2-C + BADE/BSADE + documentos que comprovem a
alteração. O Termo 3-C aparece como alternativa específica quando o estaleiro estiver
comprovadamente extinto ou em casos de construção artesanal. Portanto ele não pode ser
gerado automaticamente em toda alteração.

Os serviços permanecem DRAFT até modelar essa condição e homologar o 3-C corrigido.

## NORMAM-212 - conferência dos anexos já cadastrados

O conjunto atual está coerente com os anexos efetivamente publicados:

| Anexo | Título |
| --- | --- |
| 1-C | Declaração de Residência |
| 2-A | Requerimento para inscrição/transferência de moto aquática |
| 2-B | BDMOTO |
| 2-C | Declaração de perda, roubo ou extravio de TIE |
| 2-D | Autorização de Transferência de Propriedade |
| 2-E | Comunicação de Transferência de Propriedade de Moto Aquática |

A NORMAM-212 também contém referências internas inconsistentes: em alguns trechos o
texto remete ao “3-D” para perda de TIE, embora o anexo efetivamente publicado para TIE
seja 2-C; outro trecho menciona “2-S” para comunicação, enquanto o anexo publicado é
2-E. O projeto preserva os anexos reais 2-C e 2-E.

Moto aquática continua bloqueada em produção porque seus mapeamentos ainda estão DRAFT.
A auditoria normativa não substitui a homologação visual das coordenadas.

## Amadores (Arrais, Mestre e Capitão)

A NORMAM-211 também rege ARA/MSA/CPA.

### Inscrição para exame

O catálogo modela um serviço de Inscrição para Exame com escolha da categoria. Para
Arrais, a norma prevê Atestado de Treinamento Náutico (5-E). Para Mestre, é exigida
habilitação válida de Arrais; para Capitão, habilitação válida de Mestre.

O item 5.4.1 lista a documentação e não cita nominalmente o Anexo 5-H. Porém a orientação
operacional oficial da DPC informa que o interessado pode preencher e imprimir o
"Requerimento de Inscrição para o Exame de habilitação", e páginas oficiais de Organizações
Militares da Marinha identificam o requerimento de inscrição como o Anexo 5-H da
NORMAM-211. A aplicação, portanto, reutiliza o 5-H já homologado para este serviço sem
criar um formulário próprio. A opção "Emissão/Renovação" é marcada e a descrição do
pedido registra explicitamente a categoria escolhida: Arrais-Amador, Mestre-Amador ou
Capitão-Amador.

Fontes operacionais consultadas em 29/10/2026:
- DPC, "Para quem quer se tornar um Navegador Amador";
- COM8DN, "Subseção de Amadores", lista de documentos para inscrição;
- páginas de Capitanias que disponibilizam requerimento de amador para inscrição.

### Renovação

A renovação de CHA usa o Anexo 5-H e os documentos previstos no item 5.5.4, incluindo
CHA atual quando aplicável, atestado médico (dispensável com CNH válida), residência e GRU.

### Emissão de CHA de Veleiro

O item 5.5.2 usa o Anexo 5-H para requerer a emissão da CHA-VLA. O Anexo 5-G é a
declaração de conclusão do curso emitida pela marina, clube, entidade desportiva náutica ou
estabelecimento de treinamento. Como a aplicação preenche formulários do interessado, o
5-G não é gerado automaticamente pelo serviço. O serviço de Veleiro reutiliza o 5-H
homologado e está AVAILABLE.

### Concessão por equivalência profissional

O item 5.5.3 determina o uso do Anexo 5-H para concessão de CHA por equivalência
profissional nas categorias ARA, MSA e CPA. O serviço usa a opção 1 do 5-H e registra a
categoria pretendida na descrição do pedido. Está AVAILABLE.

### Renovação com agregação de Motonauta

O Anexo 5-H oferece a opção 3 para renovação de ARA/MSA/CPA com agregação de MTA.
A NORMAM-212, art. 3.4, exige também o Anexo 3-A e a declaração de que o interessado
conduz ou já conduziu moto aquática. O Anexo 3-A foi versionado, teve seu hash conferido
e o mapping v2 foi revisado visualmente nas duas páginas. O serviço está AVAILABLE.

### Perda, roubo, furto ou dano

Não foi criado serviço separado de “segunda via”. A NORMAM determina que, com a CHA
digital, esses casos sejam tratados por **renovação**, usando o 5-H e o Anexo 5-D (ou
Boletim de Ocorrência).

Os anexos 5-D e 5-H estão versionados, verificados e com mappings aprovados. Renovação
da CHA e Inscrição para exame de ARA/MSA/CPA estão liberadas como serviços de
preenchimento. A aplicação não valida o conjunto de documentos exigidos para protocolo;
os uploads são apenas fontes opcionais de dados para preencher os formulários.

## Aquaviários

NORMAM-211 e NORMAM-212 não são fonte suficiente para implementar os serviços
profissionais de Aquaviários. A própria NORMAM-211 referencia a NORMAM-101/DPC para
esse domínio. A categoria “Aquaviários” permanece sem serviços até a fonte normativa
correta ser incorporada.

## Política de liberação

Nenhum serviço é promovido a AVAILABLE só porque foi identificado na norma. O gate
continua sendo:

1. formulário correto e versão normativa confirmada;
2. PDF imutável no repositório e SHA-256 conferido;
3. mapeamento semântico/geométrico;
4. amostra sintética;
5. renderização e revisão visual;
6. testes de catálogo/API/frontend;
7. somente então promoção para produção.
