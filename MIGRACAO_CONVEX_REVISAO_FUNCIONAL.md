# Revisao funcional para migracao Obsidian -> Convex

Data: 2026-05-15

Este documento resume a decisao funcional atual para migrar o quadro do Obsidian para Convex.

Ele complementa [CONVEX_DATA_REQUIREMENTS.md](/Users/jrlmartini/DEV-Projects/Kanban-V02/CONVEX_DATA_REQUIREMENTS.md), que deve ser tratado como a referencia principal de modelo de dados.

## Frase-guia

> Backlog e o que ainda nao entrou no calendario. Kanban e o fluxo do que ja entrou na semana.

## Decisao de produto

O modelo deve separar duas coisas:

1. Planejamento temporal: a tarefa tem ou nao tem dia?
2. Status de fluxo: a tarefa ja comecou, esta andando, foi delegada ou terminou?

Regras:

- sem dia planejado = backlog;
- com dia planejado = tarefa da semana/calendario;
- `planned` significa "nao iniciada";
- nao existe "nao iniciada sem dia";
- nao existe bucket "Sem dia" na visao semanal;
- tarefa concluida continua no dia planejado, apenas mais discreta;
- tarefa atrasada da semana em andamento continua na semana/kanban;
- tarefa atrasada de semana anterior volta visualmente para a sidebar de backlog para ser reprogramada;
- atraso e calculado pela data real de hoje, nao pela semana visualizada.

## Modelo atual recomendado

Manter o modelo simples antes de migrar dados reais:

```ts
tasks: {
  title: string
  description?: string
  nextStep?: string
  type?: "professional" | "personal"
  status: "backlog" | "planned" | "doing" | "delegated" | "done"
  priority?: "low" | "normal" | "high" | "critical"
  plannedWeek?: string
  plannedDay?: string
  sortOrder: number
  createdAt: number
  updatedAt: number
  completedAt?: number
  archivedAt?: number
}
```

Neste modelo:

- `plannedDay` guarda a data real em `YYYY-MM-DD`;
- `plannedWeek` guarda a semana ISO em `YYYY-WNN`;
- `status = "backlog"` deve andar junto com ausencia de `plannedDay`;
- se houver `plannedDay`, status de fluxo deve ser `planned`, `doing`, `delegated` ou `done`.

## Mapeamento Obsidian -> Convex

| Obsidian | Convex atual |
|---|---|
| `title` | `title` |
| `status: todo` | `status: planned` |
| `status: backlog` | `status: backlog` |
| `status: doing` | `status: doing` |
| `status: delegated` | `status: delegated` |
| `status: done` | `status: done` |
| `priority: low` | `priority: low` |
| `priority: medium` | `priority: normal` |
| `priority: normal` | `priority: normal` |
| `priority: high` | `priority: high` |
| `priority: critical` | `priority: critical` |
| `planned_date` | `plannedDay` |
| semana calculada de `planned_date` | `plannedWeek` |
| secao `Contexto` | `description` |
| secao `Proximo passo` | `nextStep` |
| `completed_at` | `completedAt` |
| `archived_at` | `archivedAt` |
| `created` | `createdAt` |
| `updated` | `updatedAt` |

Campos antigos que podem ser guardados em fase futura:

- `id` antigo -> `publicId`;
- `project`;
- `tags`;
- `owner`;
- `delegated_to`;
- `definition_of_done`;
- caminho Markdown original -> `source.path`.

## Normalizacao na importacao

Ao importar uma tarefa:

### Sem data

```ts
status = "backlog"
plannedWeek = undefined
plannedDay = undefined
```

### Com data

```ts
plannedDay = planned_date // YYYY-MM-DD
plannedWeek = semana ISO calculada
status = status importado === "backlog" ? "planned" : status importado
```

### Concluida

```ts
status = "done"
completedAt = timestamp valido
```

### Arquivada

```ts
archivedAt = timestamp valido
```

Arquivada nao deve aparecer no dashboard ativo.

## Comportamentos que a migracao precisa preservar

- Captura rapida sem data cai no backlog.
- Escolher data tira do backlog.
- Arrastar backlog para Kanban exige escolher dia.
- Arrastar tarefa vencida de semana anterior para Kanban exige reprogramar.
- Tarefa vencida dentro da semana em andamento continua no Kanban pelo status dela.
- Navegar para semanas futuras ou passadas nao muda a definicao de atraso.
- Mover no Kanban altera apenas status.
- Mover na semana altera apenas planejamento temporal.
- Voltar ao backlog limpa dia e semana.
- Concluir nao apaga a tarefa.
- Arquivar nao apaga a tarefa.
- Restaurar pode trazer tarefa arquivada de volta para o dashboard ativo.
- Nenhuma tarefa ativa pode sumir.

## Consultas derivadas

No primeiro momento, continuar simples:

- `tasks:list` retorna todas as tarefas ativas.
- Cliente deriva cockpit, backlog, semana, kanban e e-ink.

Quando houver volume maior:

- criar query por `plannedWeek`;
- criar query por `status`;
- criar query para backlog ativo;
- criar query para arquivadas/auditoria.

## O que nao fazer agora

- Nao criar tabela separada para Kanban.
- Nao criar tabela separada para semana.
- Nao duplicar tarefa entre views.
- Nao separar `plannedDate` e `plannedDay` nesta fase.
- Nao criar bucket "Sem dia" na semana.
- Nao deletar tarefa como acao normal de produto; usar `archive`.

## Proxima fase recomendada

1. Manter o schema atual ate testar fluxo real.
2. Criar importador Obsidian -> Convex com normalizacao acima.
3. Rodar importacao em ambiente de teste.
4. Validar contagens:
   - backlog;
   - atrasadas;
   - hoje;
   - semana;
   - concluidas;
   - arquivadas.
5. Validar que atraso continua relativo ao dia real de hoje ao navegar para outra semana.
6. Validar que atraso da semana em andamento nao duplica na sidebar.
7. Validar que atraso de semana anterior entra na sidebar para reprogramacao.
8. So depois avaliar campos extras como `project`, `tags`, `delegatedTo`, `revision` e `source`.

Resumo:

> A tarefa continua unica. As views so mudam a forma de agrupar, filtrar e agir sobre ela.
