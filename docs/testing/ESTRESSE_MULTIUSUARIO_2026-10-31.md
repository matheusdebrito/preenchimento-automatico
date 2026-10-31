# Teste de estresse multiusuário — 31/10/2026

## Objetivo, isolamento e escopo
Teste real de HTTP concorrente, API Fastify, Nginx e PostgreSQL 17 em **um único Docker Compose** isolado
num runner temporário do GitHub Actions, usando 130 contas e sessões distintas criadas
**somente no banco descartável de teste**.

Executado com documento desativado: nenhuma chamada à OpenAI, nenhum arquivo pessoal,
nenhuma cobrança, nenhum deploy e nenhuma requisição a servidores de produção.
As contas/sessões são semeadas diretamente no banco descartável para não confundir
a carga do teste com o throttle de cadastro/login do produto.

Evidências: [GitHub Actions 41238916144](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/41238916144),
artefato `stress-multiuser-130-testusers`, contendo JSON, relatório, amostras de recursos e logs.

## 1. Consulta e cotação dos serviços
Picos simultâneos com uma requisição por usuário a cada iteração:
 
| Usuários | Requisições | HTTP 200 | p95 (ms) | Vazão (req/s) |
|---:|---:|---:|---:|---:|
| 1 | 3 | 3 | 13,0 | 84,7 |
| 10 | 30 | 30 | 61,9 | 244,8 |
| 25 | 75 | 75 | 85,4 | 435,2 |
| 50 | 150 | 150 | 134,3 | 457,2 |
| 100 | 300 | 300 | 226,6 | 535,0 |

Carga sustentada de **100 usuários ativos** (requisições ritmadas, não
100 requisições continuamente em voo): 20,9 segundos, **2.395/2.395 HTTP 200**,
114,6 req/s, p50 2,4 ms, p95 9,5 ms, p99 139,3 ms.

## 2. Criação de processos / geração dos PDFs

| Usuários tentando iniciar ao mesmo tempo | Criados | Recusados por capacidade | Outros erros | Geração/download completos |
|---:|---:|---:|---:|---:|
| 1 | 1 | 0 | 0 | 1/1 |
| 2 | 2 | 0 | 0 | 2/2 |
| 3 | 3 | 0 | 0 | 3/3 |
| 5 | 3 | 2 | 0 | 3/3 |
| 10 | 3 | 7 | 0 | 3/3 |
| 25 | 3 | 22 | 0 | 3/3 |
| 50 | 3 | 47 | 0 | 3/3 |
| 100 | 3 | 97 | 0 | 3/3 |

Os processos aceitos completaram extração **sem upload**, revisão com dados
fictícios plausíveis, geração e download de **dois formulários por processo**.
p95 da geração no pico de 100 tentativas: **17,9 ms**, considerando apenas os
três processos admitidos. Esse número não demonstra que o motor aguente
100 gerações simultâneas, pois o restante da carga não foi admitida.

**Causa confirmada no código:**
`backend/src/modules/jobs/job-store.ts` define `MAX_ROOT_FILES = 3` para
a instância inteira e rejeita novos processos se a soma de jobs ativos e
reservas atingir esse número. A rota `POST /api/jobs` responde com HTTP 503
`capacity_exceeded`. Trata-se de um **limite funcional configurado**, não
de travamento observado de CPU ou memória.

## 3. CPU/RAM e saúde

As capturas esparsas (`docker stats --no-stream`) durante a fase sustentada
registraram a API com aproximadamente **116–120 MiB** de memória e
~14–56% de CPU (percentuais docker por amostra; não são picos garantidos).
O PostgreSQL teve aproximadamente 26–29 MiB nas amostras. A aplicação
continuou respondendo (HTTP 200) após a carga.

Essas medições não representam CPU/RAM na VPS do usuário, consumo por OCR,
tráfego pela Internet, IA externa, fila de trabalho ou o armazenamento
de uploads reais. O ciclo não foi projetado para detectar vazamentos de
memória de longa duração nem suportar 100 gerações simultâneas.

## 4. Recomendações antes de escalar

1. **Tratar o teto global de 3 processos:** decidir uma política explícita
   de admissão e fila/backpressure com limites por usuário e por instância,
   sem simplesmente elevar o número a 100 sem medir memória e tempo de PDFs.
2. **Persistência e distribuição:** jobs estão em memória (`Map`) e seus
   arquivos temporários ficam em disco local; múltiplas réplicas exigem
   arquitetura de sessão/job/armazenamento compartilhada ou um encaminhamento
   consciente ao worker, não apenas adicionar containers.
3. **Provar o pior caso real:** executar teste controlado de upload de arquivos
   sintéticos representativos, processamento de PDFs e resposta OpenAI simulada
   com latência, limites de tokens, tempos de espera e falhas. Medir orçamento
   de API separadamente antes de habilitar IA real.
4. **Aplicar observabilidade e critérios:** coletar p95/p99, fila, duração de
   geração, HTTP 429/503, disponibilidade, custo de uso, RSS/CPU,
   vazão e tempo de limpeza das sessões.

## Como reproduzir

No GitHub: **Actions → Estresse multiusuario (isolado) → Run workflow**.
Executa o script `backend/scripts/stress-multiuser.mjs` sem dependências
adicionais nem alteração nas regras de produção; os resultados ficam em
`stress-multiuser-130-testusers` e os volumes do banco são apagados ao final.
O workflow é **manual**, para evitar custo ou carga recorrente desnecessária.
