# Prévia sintética de runtime — removida

Este documento registra uma abordagem histórica que não faz mais parte da aplicação.

O servidor agora utiliza somente o catálogo oficial em runtime. Não existe mais uma flag de
ambiente para promover temporariamente serviços ou mapeamentos `DRAFT`, zerar cobrança ou
gerar PDFs especiais por meio de um overlay de catálogo.

Validações sintéticas continuam sendo feitas diretamente pela suíte automatizada, com
`catalogOverride` restrito a testes isolados quando necessário. Serviços reais só passam a
`AVAILABLE` e mapeamentos só passam a `APPROVED` no catálogo oficial após os respectivos
gates de revisão e homologação.

Não use este arquivo como roteiro operacional.
