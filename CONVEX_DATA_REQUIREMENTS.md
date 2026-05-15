# Convex data requirements

Este documento e a referencia curta para agentes editarem a base Convex do dashboard/kanban sem quebrar a logica de produto.

Principio central:

> Backlog e o que esta fora do calendario. Kanban e o fluxo do que ja entrou na semana.

## Fonte da verdade

A fonte unica da verdade e a tabela `tasks`.

Nao existem tabelas separadas para:

- Kanban;
- semana;
- cockpit;
- backlog;
- e-ink.

Essas visoes sao sempre derivadas dos mesmos registros de `tasks`.

## Modelo atual da tabela `tasks`

O schema atual fica em [convex/schema.ts](/Users/jrlmartini/DEV-Projects/Kanban-V02/convex/schema.ts).

Campos ativos:

```ts
{
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

Formatos:

- `plannedWeek`: semana ISO em `YYYY-WNN`, exemplo `2026-W20`.
- `plannedDay`: data real em `YYYY-MM-DD`, exemplo `2026-05-14`.
- timestamps: numeros em milissegundos.

Defaults de leitura:

- `type` vazio deve ser tratado como `professional`.
- `priority` vazia deve ser tratada como `normal`.
- tarefa sem `plannedDay` deve ser tratada como `backlog`.
- tarefa com `plannedDay` e `status = "backlog"` deve ser tratada como `planned` na UI.

## Regra mental do produto

Existem duas dimensoes separadas.

### 1. Planejamento temporal

Pergunta:

```text
Essa tarefa entrou no calendario?
```

Resposta:

- sem `plannedDay` = fora do calendario = backlog;
- com `plannedDay` = entrou no calendario = aparece na semana;
- `plannedWeek` deve acompanhar `plannedDay`.

Nao deve existir estado valido de "planejada para a semana, mas sem dia".

### 2. Status de fluxo

Pergunta:

```text
Qual e o andamento da tarefa?
```

Valores:

- `planned`: nao iniciada;
- `doing`: em andamento;
- `delegated`: delegada;
- `done`: concluida.

Esses status so fazem sentido para tarefas com `plannedDay`.

`backlog` existe no schema atual por compatibilidade e simplicidade, mas conceitualmente significa "sem dia planejado".

## Invariantes obrigatorias

Toda mutation deve preservar estas regras:

1. Se `plannedDay` estiver vazio, a tarefa fica em `status = "backlog"`.
2. Se `plannedDay` existir e o status recebido for `backlog`, normalizar para `planned`.
3. Se uma tarefa volta ao backlog, limpar `plannedWeek`, `plannedDay` e `completedAt`.
4. `plannedWeek` e derivado de `plannedDay`; cliente nao deve ser fonte confiavel desse campo.
5. Mover no Kanban altera status, mas nao altera dia.
6. Mover na semana altera dia/semana, mas preserva status quando ele ja for `doing`, `delegated` ou `done`.
7. Concluir so faz sentido com `plannedDay`; sem dia, a tarefa permanece backlog.
8. Concluir define `status = "done"` e preenche `completedAt`; editar uma concluida preserva o `completedAt` original.
9. Desconcluir ou mover para status diferente de `done` limpa `completedAt`.
10. Arquivar preenche `archivedAt` e tira a tarefa das listas ativas.
11. Nenhuma tarefa ativa pode ficar invisivel: se nao houver dia, mostrar no backlog.

## Atrasadas e backlog

Atraso e sempre calculado em relacao a data real de hoje.

A semana visualizada serve apenas para filtrar o periodo que o usuario esta olhando. Ela nao pode decidir se uma tarefa esta atrasada.

A semana em andamento, calculada pela data real de hoje, define se uma tarefa vencida deve voltar visualmente para o backlog de reprogramacao.

### Tarefa atrasada planejada

Uma tarefa com `plannedDay < hoje` e `status != "done"` esta atrasada para o Cockpit.

Ela deve aparecer no Cockpit > Atrasadas.

Se a tarefa atrasada ainda pertence a semana em andamento, ela continua aparecendo no dia planejado e no fluxo do Kanban. Exemplo: uma tarefa de terca-feira ainda nao iniciada, vista na sexta-feira da mesma semana, continua em `Nao iniciadas`.

Se a tarefa atrasada pertence a uma semana anterior a semana em andamento, ela deve aparecer tambem na sidebar de backlog como item para reprogramacao.

### Backlog atrasado

Na UI atual, a sidebar trata como backlog atrasado qualquer tarefa ativa, nao concluida, com `plannedDay` anterior ao dia real de hoje e fora da semana em andamento.

Isso evita duplicidade ruidosa dentro da semana atual e permite que uma tarefa vencida de semana anterior saia do fluxo principal e volte visualmente para a area de reprogramacao.

Importante:

- essa classificacao pode ser derivada na UI;
- nao precisa apagar automaticamente a data antiga no banco;
- ao arrastar atraso de semana anterior para o Kanban, abrir o modal de planejamento para escolher novo dia.
- navegar para semana futura ou passada nao deve alterar a classificacao de atraso.

## Visoes derivadas

### Cockpit

Entram tarefas ativas, nao arquivadas, nao concluidas, que estejam em algum destes grupos:

- hoje;
- atrasadas;
- delegadas;
- proximos 14 dias;
- backlog relevante.

### Sidebar de backlog

Mostra tarefas que precisam ser planejadas ou reprogramadas.

Abas:

- `Todos`: atrasadas de semanas anteriores + backlog sem data;
- `Atrasadas`: tarefas pendentes com data anterior a hoje e fora da semana em andamento;
- `Backlog`: tarefas sem data.

### Kanban

Mostra fluxo das tarefas com dia planejado dentro do escopo escolhido.

Colunas:

- `planned`: Nao iniciadas;
- `doing`: Em andamento;
- `delegated`: Delegadas;
- `done`: Concluidas.

Regras:

- tarefa sem `plannedDay` nao entra no Kanban;
- tarefa atrasada da semana em andamento continua no Kanban conforme status;
- tarefa atrasada de semana anterior nao deve ficar solta no Kanban ativo;
- ao tentar colocar tarefa sem data ou atraso de semana anterior no Kanban, abrir planejamento.

### Visao semanal

Mostra apenas tarefas com `plannedDay` dentro da semana selecionada.

Grupos:

- segunda;
- terca;
- quarta;
- quinta;
- sexta;
- fim de semana.

Tarefa concluida continua no dia planejado, mas com visual mais discreto.

Nao existe bucket separado de concluidas na visao semanal.

### E-ink

Leitura estatica para quadro preto e branco, com preset principal `800x480` e presets auxiliares para revisao (`1024x758`, `tablet`, `print`).

Mostra apenas distribuicao semanal por dia.

Nao deve depender de estado navegavel.

## Funcoes Convex atuais

Arquivo: [convex/tasks.ts](/Users/jrlmartini/DEV-Projects/Kanban-V02/convex/tasks.ts)

- `list`: retorna tarefas ativas, ordenadas por `sortOrder` e `updatedAt`.
- `create`: cria tarefa e normaliza backlog vs planejada.
- `update`: substitui os campos do formulario, normaliza status/data e preserva `completedAt` quando a tarefa ja estava concluida.
- `moveInKanban`: muda status; nao deve planejar tarefa sem dia.
- `plan`: planeja data e status em uma unica mutation atomica.
- `moveToWeek`: define ou remove planejamento temporal.
- `moveToBacklog`: limpa planejamento e volta para backlog.
- `complete`: marca como concluida.
- `archive`: arquiva sem deletar.
- `restore`: restaura uma tarefa arquivada. Usada principalmente pelo toast de `Desfazer`.
- `restoreSnapshot`: restaura snapshot controlado para desfazer mudancas de status/data/conclusao.

## Indices atuais

Arquivo: [convex/schema.ts](/Users/jrlmartini/DEV-Projects/Kanban-V02/convex/schema.ts)

- `by_status`
- `by_planned_week`
- `by_planned_day`
- `by_completed_at`
- `by_archived_at`

Hoje `list` carrega tudo ativo e o cliente agrupa. Quando o volume crescer, criar queries especificas usando esses indices.

## Campos candidatos para fase futura

Nao adicionar agora sem necessidade.

Possiveis evolucoes:

```ts
publicId?: string
project?: string
tags?: string[]
owner?: string
delegatedTo?: string
definitionOfDone?: string
revision?: number
source?: {
  kind: "obsidian" | "convex" | "imported"
  path?: string
  importedAt?: number
}
```

Observacao importante:

Nao separar `plannedDate` e `plannedDay` agora. No modelo atual, `plannedDay` e a data real `YYYY-MM-DD`. A divisao entre data real e dia operacional pode ser avaliada depois, se o importador Obsidian realmente exigir.

## Checklist para agentes

Antes de alterar Convex, confirme:

- [ ] A tarefa sem data sempre aparece no backlog.
- [ ] A tarefa com data aparece na semana.
- [ ] `plannedWeek` e sempre recalculado a partir de `plannedDay`.
- [ ] Kanban nunca cria tarefa sem data.
- [ ] Kanban `Todas` mostra tarefas planejadas de todas as semanas.
- [ ] Mover status nao muda data.
- [ ] Mover dia nao muda status ativo sem necessidade.
- [ ] Voltar ao backlog limpa data e semana.
- [ ] Concluida nao conta como atrasada.
- [ ] Editar concluida nao muda `completedAt`.
- [ ] Desfazer usa `restoreSnapshot` quando precisa restaurar status/data/conclusao.
- [ ] Atraso usa a data real de hoje, nao a semana visualizada.
- [ ] Atraso da semana em andamento continua no fluxo da semana.
- [ ] Atraso de semana anterior aparece na sidebar para reprogramacao.
- [ ] Arquivada nao aparece no dashboard ativo.
- [ ] Arquivada pode ser restaurada por `restore`.
- [ ] Nenhuma mudanca cria tarefa invisivel.

## Configuracao

Para usar Convex:

```bash
npm install
npm run convex:dev
```

Depois configurar `.env.local`:

```bash
VITE_CONVEX_URL=https://seu-deployment.convex.cloud
```

Sem `VITE_CONVEX_URL`, o app usa armazenamento local temporario para desenvolvimento.
