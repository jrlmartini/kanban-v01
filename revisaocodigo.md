# Revisao profunda de codigo - FocusFlow Kanban

Data da revisao: 2026-05-15.

Objetivo: listar erros, redundancias, inconsistencias e trechos obsoletos para orientar o coding agent na proxima rodada de melhoria da aplicacao.

## Validacoes executadas

- `npm run lint`: passou sem erros.
- `npx tsc -b --pretty false`: passou sem erros.
- Revisao estatica dos arquivos principais:
  - `src/main.tsx`
  - `src/styles.css`
  - `src/lib/taskRules.ts`
  - `src/lib/localTasks.ts`
  - `src/lib/dates.ts`
  - `src/components/ui/*`
  - `convex/schema.ts`
  - `convex/tasks.ts`

## Resumo executivo

O codigo esta funcional e evoluiu bem desde o MVP inicial, mas ainda carrega algumas decisoes temporarias. O maior risco nao e sintaxe ou build: e consistencia de regra de negocio. As regras de status, data, backlog, conclusao e undo aparecem espalhadas entre UI, storage local e Convex. Isso aumenta a chance de a aplicacao se comportar diferente em modo Local e modo Convex.

Prioridade recomendada:

1. Corrigir bugs de comportamento no Kanban e em `completedAt`.
2. Unificar normalizacao de tarefa entre Local, Convex e UI.
3. Remover redundancias e API obsoleta.
4. Melhorar acessibilidade estrutural e robustez de storage/mutations.
5. Quebrar `src/main.tsx` em componentes menores.

## Achados criticos

### 1. Kanban com escopo `Todas` nao mostra todas as tarefas planejadas

Arquivo: `src/main.tsx`

Trecho:

- `KanbanView`, linhas aproximadas 765-786.

Problema:

`scopedTasks` inclui tarefas de todas as semanas quando `scope === "all"`, mas a coluna `planned` filtra novamente por `task.plannedWeek === currentWeek`.

```ts
if (column.status === "planned") return status === "planned" && task.plannedWeek === currentWeek;
```

Consequencia:

- Em escopo `Todas`, tarefas `planned` de outras semanas ficam invisiveis.
- `doing`, `delegated` e `done` respeitam melhor o escopo `Todas`, mas `planned` nao.

Correcao sugerida:

```ts
if (column.status === "planned") {
  return status === "planned" && (scope === "all" || task.plannedWeek === currentWeek);
}
```

Tambem criar caso de QA cobrindo tarefa `planned` em semana futura/passada com Kanban em `Todas`.

### 2. Convex sobrescreve `completedAt` ao editar tarefa ja concluida

Arquivos:

- `convex/tasks.ts`, linhas aproximadas 83-90.
- `src/lib/localTasks.ts`, linhas aproximadas 100-108.

Problema:

No Convex, `update` define `completedAt` como `now` sempre que `normalized.status === "done"`:

```ts
completedAt: normalized.status === "done" ? now : undefined
```

No storage local, a regra preserva o `completedAt` anterior:

```ts
completedAt: normalized.status === "done" ? task.completedAt ?? now : undefined
```

Consequencia:

- Editar uma tarefa concluida muda retroativamente a data/hora de conclusao no Convex.
- Undo via `taskToDraft(previous)` nao restaura o `completedAt` original no Convex, porque `TaskDraft` nao carrega esse campo.
- Progresso semanal e historico podem ficar falsos.

Correcao sugerida:

- Em `convex/tasks.update`, buscar a tarefa atual antes do patch.
- Se o proximo status for `done`, preservar `task.completedAt ?? now`.
- Se status sair de `done`, limpar `completedAt`.
- Considerar uma mutation especifica para restaurar snapshot completo quando for undo.

### 3. Undo nao restaura snapshot completo da tarefa

Arquivos:

- `src/main.tsx`, `runQuickAction`, `taskToDraft`, linhas aproximadas 1138-1154.
- `convex/tasks.ts`, `update`, linhas aproximadas 71-92.

Problema:

O undo usa:

```ts
actions.updateTask(previous._id, taskToDraft(previous))
```

Mas `TaskDraft` nao inclui:

- `completedAt`
- `archivedAt`
- `sortOrder`
- `createdAt`
- `updatedAt`

Consequencia:

- Para alteracoes de status, a restauracao e parcial.
- Para tarefa concluida, o timestamp original nao volta corretamente no Convex.
- Para arquivamento, foi criada uma excecao com `restoreTask`, mas isso so resolve `archivedAt`.

Correcao sugerida:

- Criar uma action/mutation `restoreSnapshot` ou `restoreTaskState` com campos controlados.
- Ou criar mutations de undo especificas por fluxo: `undoComplete`, `undoMoveToBacklog`, `undoUpdate`.
- Evitar usar `updateTask` generico como mecanismo universal de undo.

### 4. Normalizacao de tarefa duplicada e divergente

Arquivos:

- `src/lib/localTasks.ts`, `resolveDraftStatus` e `normalizeDraft`, linhas aproximadas 46-64.
- `convex/tasks.ts`, `resolveInputStatus` e `normalizeTaskInput`, linhas aproximadas 7-36.
- `src/lib/taskRules.ts`, `getEffectiveStatus`, linhas aproximadas 21-25.
- `src/main.tsx`, modal e planning, linhas aproximadas 899-1031.

Problema:

A regra "sem data = backlog; com data + backlog = planned" existe em varios lugares.

Consequencia:

- Local e Convex ja divergiram em `completedAt`.
- Novas regras podem ser corrigidas em um lugar e esquecidas em outro.
- Fica dificil garantir que importacao, UI e persistencia compartilham o mesmo modelo mental.

Correcao sugerida:

- Centralizar regras puras em um modulo compartilhavel, por exemplo `src/lib/taskModel.ts`.
- Convex nao pode importar diretamente tudo do client se houver dependencias de React/browser, entao manter esse modulo puro, sem React e sem DOM.
- Funcoes candidatas:
  - `normalizeTaskDraft`
  - `getEffectiveStatus`
  - `shouldClearCompletedAt`
  - `resolveCompletedAt`
  - `isTaskOverdue`
  - `isBacklogReplanCandidate`

## Bugs e inconsistencias funcionais

### 5. `completeTask` permite concluir tarefa sem data, criando estado incoerente

Arquivos:

- `src/lib/localTasks.ts`, linhas aproximadas 155-159.
- `convex/tasks.ts`, linhas aproximadas 171-180.
- `src/lib/taskRules.ts`, linhas aproximadas 21-24.

Problema:

As mutations/actions `completeTask` marcam qualquer tarefa como `done`, mesmo sem `plannedDay`.

Mas `getEffectiveStatus` retorna `backlog` para qualquer tarefa sem `plannedDay`, antes de olhar `task.status`.

Consequencia:

- Uma tarefa pode ter `status: "done"` e `completedAt`, mas aparecer como backlog efetivo.
- Hoje a UI evita isso em alguns caminhos, mas a camada de dados nao protege.

Correcao sugerida:

- Definir regra de produto:
  - ou "tarefa so pode ser concluida se estiver planejada";
  - ou "concluir sem data atribui data de hoje automaticamente".
- Validar isso em Local e Convex.

### 6. Mutation `update` do Convex e perigosa como patch parcial

Arquivo: `convex/tasks.ts`, linhas aproximadas 71-92.

Problema:

`update` aceita varios campos opcionais, mas `normalizeTaskInput` aplica defaults:

```ts
type: args.type ?? "professional"
priority: args.priority ?? "normal"
status: resolveInputStatus(args.plannedDay, args.status)
```

Consequencia:

Se algum cliente chamar `update` parcialmente, campos omitidos podem ser resetados para defaults ou backlog. A UI atual envia um draft completo, mas a mutation publica nao deixa isso explicito.

Correcao sugerida:

- Renomear para `replaceTaskFromDraft` se a intencao for substituicao completa.
- Ou transformar em patch real, buscando a tarefa atual e mesclando antes de normalizar.
- Separar mutation de formulario e mutations de fluxo.

### 7. Criacao aceita titulo vazio no backend

Arquivo: `convex/tasks.ts`, linhas aproximadas 47-68.

Problema:

`title` e `v.string()`, mas depois:

```ts
title: normalized.title ?? ""
```

Se chegar `"   "`, o backend grava `""`.

Consequencia:

- A UI bloqueia titulo vazio, mas qualquer chamada direta ao Convex pode criar atividade sem titulo.

Correcao sugerida:

- Validar `args.title.trim()` na mutation e rejeitar vazio.
- Aplicar a mesma regra em Local.

### 8. `plannedWeek` pode ficar inconsistente com `plannedDay`

Arquivos:

- `convex/tasks.ts`, `normalizeTaskInput`, linhas aproximadas 25-35.
- `src/lib/localTasks.ts`, `normalizeDraft`, linhas aproximadas 52-64.
- `src/main.tsx`, linhas aproximadas 899 e 1027.

Problema:

As normalizacoes aceitam `plannedWeek` vindo de fora quando ha `plannedDay`, em vez de sempre recalcular pelo dia.

Consequencia:

- Um cliente pode gravar `plannedDay: "2026-05-15"` com `plannedWeek: "2026-W30"`.
- As views que dependem de `plannedWeek` podem sumir com a tarefa ou coloca-la em semana errada.

Correcao sugerida:

- Sempre derivar `plannedWeek` de `plannedDay` no backend e na action local.
- Tratar `plannedWeek` como campo derivado, nao como entrada confiavel.

### 9. Drop para backlog nao tem feedback nem undo

Arquivo: `src/main.tsx`, linhas aproximadas 578-590.

Problema:

Ao soltar uma tarefa no backlog, a action chama `actions.moveToBacklog(id)` diretamente, sem `onNotify` nem undo.

Consequencia:

- Fluxo diverge de concluir/iniciar/arquivar, que tem toast e desfazer.
- Mover para backlog e uma acao de alto impacto, pois limpa data, semana e `completedAt`.

Correcao sugerida:

- Passar `onNotify` para `BacklogSidebar`.
- Capturar snapshot anterior da tarefa.
- Mostrar toast `Voltou ao backlog` com `Desfazer`.

### 10. Planejamento executa duas mutations separadas

Arquivo: `src/main.tsx`, `PlanningDialog.plan`, linhas aproximadas 1025-1031.

Problema:

Planejar faz:

```ts
await actions.moveToWeek(...)
await actions.moveInKanban(...)
```

Consequencia:

- Em Convex, se a primeira mutation passar e a segunda falhar, a tarefa fica parcialmente alterada.
- O historico do `updatedAt` muda duas vezes.
- Regras de status ficam distribuidas em duas operacoes.

Correcao sugerida:

- Criar mutation/action atomica `planTask(id, plannedDay, targetStatus)`.
- Ela deve calcular `plannedWeek`, aplicar status, limpar/preservar `completedAt` corretamente e fazer um unico patch.

## Acessibilidade e estrutura HTML

### 11. `SidebarCard` tem elemento interativo dentro de elemento com `role="button"`

Arquivo: `src/main.tsx`, linhas aproximadas 630-658.

Problema:

O card e um `<article role="button" tabIndex={0}>` e dentro dele ha um `<button>Planejar</button>`.

Consequencia:

- Interativo dentro de interativo e ruim para leitores de tela e navegacao por teclado.
- Pode gerar eventos de teclado/clique ambiguos.

Correcao sugerida:

- Transformar o card em layout nao interativo com dois botoes internos:
  - botao principal invisualmente/card-like para abrir detalhes;
  - botao secundario para planejar.
- Ou manter card como botao e mover `Planejar` para menu externo, sem aninhar.

### 12. `SidebarCard` trata espaco/enter sem `preventDefault`

Arquivo: `src/main.tsx`, linhas aproximadas 638-640.

Problema:

```ts
if (event.key === "Enter" || event.key === " ") onOpenTask(task);
```

Consequencia:

- Pressionar espaco pode rolar a pagina alem de abrir o modal.
- Leitores de tela e teclado podem ter comportamento duplicado.

Correcao sugerida:

- Chamar `event.preventDefault()` e `event.stopPropagation()`.
- Idealmente resolver junto com a remocao de `role="button"` no card pai.

### 13. Dialog simples demais para modal de producao

Arquivo: `src/components/ui/dialog.tsx`.

Problemas:

- Nao ha foco inicial/focus trap.
- Nao restaura foco ao fechar.
- `onOpenChange` nao recebe `open: boolean`, apesar do nome sugerir API controlada.
- Overlay fecha no `onMouseDown`, dependendo de cada `DialogContent` lembrar de parar propagacao.

Consequencia:

- Funciona para MVP, mas e fragil para acessibilidade e para modais mais complexos.

Correcao sugerida:

- Usar Radix Dialog/shadcn de verdade, ou evoluir esse wrapper:
  - foco preso dentro do modal;
  - `aria-labelledby`;
  - restauracao de foco;
  - fechamento por overlay robusto;
  - assinatura clara `onClose`.

## Redundancias e codigo obsoleto

### 14. `sortOrder` existe mas nao ha reorder real

Arquivos:

- `src/types.ts`, linha aproximada 17.
- `convex/schema.ts`, linha aproximada 38.
- `src/lib/localTasks.ts`, linhas aproximadas 17, 27, 40, 93.
- `convex/tasks.ts`, linhas aproximadas 43 e 64.

Problema:

`sortOrder` e usado para ordenacao, mas nao existe mais mutation/action de reorder nem logica de reordenar por drag.

Consequencia:

- Campo parece prometer ordenacao manual, mas so guarda a ordem de criacao.
- O nome pode enganar proximas implementacoes.

Opcoes:

- Se reordenacao esta no roadmap: recriar `reorder` em Local e Convex, com testes.
- Se nao esta: renomear mentalmente/documentar como `createdSortOrder` ou simplificar para `createdAt`.

### 15. `test:flows` ainda nao testa fluxos

Arquivo: `package.json`.

Problema:

```json
"test:flows": "npm run lint && npm run build"
```

Consequencia:

- O nome sugere testes de comportamento, mas executa apenas lint/build.
- Pode dar falsa confianca sobre os casos descritos em `FLOW_QA_CASES.md`.

Correcao sugerida:

- Renomear temporariamente para `check`.
- Quando houver Playwright/Vitest, fazer `test:flows` executar os casos reais.

### 16. `src/main.tsx` concentra responsabilidades demais

Arquivo: `src/main.tsx`, 1259 linhas.

Responsabilidades atuais no mesmo arquivo:

- provider Local/Convex;
- estado global da tela;
- cockpit;
- filtros;
- sidebar;
- calendario semanal;
- views Semana/Kanban;
- cards;
- modal de tarefa;
- planning dialog;
- toast;
- helpers de data/formatacao/undo.

Consequencia:

- Cada ajuste visual ou funcional aumenta risco de regressao.
- Dificulta testes unitarios de regras.
- Dificulta reuso de componentes.

Quebra sugerida:

- `components/Cockpit.tsx`
- `components/FilterPanel.tsx`
- `components/BacklogSidebar.tsx`
- `components/WeekPicker.tsx`
- `components/WeekView.tsx`
- `components/KanbanView.tsx`
- `components/TaskCard.tsx`
- `components/TaskModal.tsx`
- `components/PlanningDialog.tsx`
- `components/Toast.tsx`
- `lib/formatters.ts`
- `lib/taskModel.ts`

### 17. CSS grande e com estilos globais que podem vazar

Arquivo: `src/styles.css`, 1949 linhas.

Problemas:

- Muitos seletores globais (`h1`, `h2`, `p`, `button`, `input`, etc.).
- Componentes de UI e layout de produto vivem no mesmo arquivo.
- Classes de app, e-ink, modal, cards e filtros compartilham o mesmo espaco.

Consequencia:

- Mudancas em um componente podem afetar outro sem querer.
- Dificulta remocao de codigo morto.

Quebra sugerida:

- `styles/tokens.css`
- `styles/layout.css`
- `styles/components/cards.css`
- `styles/components/modal.css`
- `styles/components/eink.css`
- `styles/components/forms.css`

## Robustez de dados e storage

### 18. `localStorage` de filtros e preset e confiado sem validacao

Arquivo: `src/main.tsx`.

Trechos:

- `eInkPreset`, linha aproximada 128.
- `loadSavedFilters`, linhas aproximadas 1165-1174.

Problema:

O app faz cast direto:

```ts
localStorage.getItem(eInkPresetStorageKey) as EInkPreset
```

E mescla filtros parseados sem validar se os valores pertencem aos unions.

Consequencia:

- Um valor antigo, editado manualmente ou legado pode gerar filtro invisivel ou classe CSS inexistente.

Correcao sugerida:

- Criar validators:
  - `isTaskStatus`
  - `isTaskPriority`
  - `isTaskType`
  - `isEInkPreset`
- Se invalido, voltar ao fallback.

### 19. Persistencia local salva toda mudanca imediatamente

Arquivo: `src/lib/localTasks.ts`, `saveLocalTasks`.

Problema:

O app salva todo array no localStorage a cada mudanca.

Consequencia:

- Para MVP ok.
- Para volume grande, pode travar UI e nao ha tratamento de quota/corrupcao.

Correcao sugerida:

- Manter para MVP, mas isolar em uma camada `localTaskRepository`.
- Tratar erro de quota.
- Considerar migração/versionamento do storage local.

### 20. Seeds locais estao presos em datas de 2026-W20

Arquivo: `src/lib/localTasks.ts`, linhas aproximadas 6-44.

Problema:

As tarefas seed usam datas fixas de maio de 2026.

Consequencia:

- Em qualquer data fora desse periodo, a primeira experiencia local fica artificialmente atrasada ou fora do contexto.
- Para demos futuras, isso envelhece rapido.

Correcao sugerida:

- Gerar seeds relativos a `new Date()` ou separar `demoSeeds.ts`.
- Se os seeds forem documentacao viva, explicitar isso.

## Performance e Convex

### 21. Query Convex busca tudo e filtra em memoria

Arquivo: `convex/tasks.ts`, linhas aproximadas 39-44.

Problema:

```ts
const tasks = await ctx.db.query("tasks").collect();
return tasks.filter(...).sort(...);
```

Consequencia:

- Funciona no MVP.
- Com historico real, arquivadas e recorrencias, vai crescer mal.
- Indices do schema existem, mas nao sao usados.

Correcao sugerida:

- Criar queries especificas:
  - `listActive`
  - `listByWeek`
  - `listBacklog`
  - `listCockpit`
  - `listArchived`
- Usar indices `by_archived_at`, `by_planned_week`, `by_status` quando fizer sentido.

### 22. Mutations nao verificam existencia antes de patch em varios casos

Arquivo: `convex/tasks.ts`.

Exemplos:

- `moveToBacklog`
- `complete`
- `archive`
- `restore`

Problema:

Essas mutations chamam `ctx.db.patch` direto. Se o id nao existir, o erro sobe.

Consequencia:

- Pode ser aceitavel, mas o comportamento diverge de `moveInKanban` e `moveToWeek`, que fazem `get` e retornam se nao existir.

Correcao sugerida:

- Padronizar: ou todas retornam silenciosamente quando nao existe, ou todas lancam erro claro.
- Preferir erro claro para diagnostico, ou retorno silencioso para UI otimista. O importante e consistencia.

## UX tecnica e estados de erro

### 23. Falhas de mutation nao tem tratamento de erro amigavel

Arquivo: `src/main.tsx`.

Problema:

Fluxos `save`, `complete`, `archive`, `moveBacklog`, `plan`, `runQuickAction` aguardam promises, mas nao capturam erro para mostrar feedback.

Consequencia:

- Em erro de rede/Convex, o usuario pode ficar sem resposta clara.
- Algumas acoes fecham modal apenas depois do await, o que ajuda, mas nao ha mensagem explicativa.

Correcao sugerida:

- Criar helper `runActionWithNotice`.
- Padrao:
  - estado `isSaving`;
  - desabilitar botoes durante request;
  - toast de erro;
  - log tecnico no console apenas em dev.

### 24. Botoes podem disparar acoes duplicadas

Arquivos:

- `src/main.tsx`, modais e cards.

Problema:

Nao ha estado de pending por acao.

Consequencia:

- Duplo clique em `Concluir`, `Planejar` ou `Salvar` pode chamar mutation duas vezes.
- Em `complete`, isso pode alterar `completedAt` duas vezes.

Correcao sugerida:

- Adicionar `pendingAction` local nos modais e cards.
- Desabilitar botoes enquanto mutation esta em andamento.

## Pontos positivos que devem ser preservados

- `taskRules.ts` foi uma boa direcao: regras derivadas comecaram a sair da UI.
- `WorkflowStatus = Exclude<TaskStatus, "backlog">` reduz um erro comum no Kanban.
- `FLOW_QA_CASES.md` e muito util como ponte para testes automatizados.
- O design tokenizado em CSS esta consistente com a identidade visual.
- O modo e-ink foi isolado visualmente e tem presets.
- `aria-pressed`, `aria-live` e labels de botoes ja melhoraram a acessibilidade.

## Plano de ataque sugerido para o coding agent

### Etapa 1 - Corrigir comportamento

1. Corrigir coluna `planned` no Kanban `Todas`.
2. Corrigir preservacao de `completedAt` no Convex.
3. Impedir conclusao de tarefa sem data ou auto-planejar para hoje.
4. Fazer drop para backlog ter toast e undo.
5. Criar mutation/action atomica para planejamento.

### Etapa 2 - Centralizar regras

1. Criar `src/lib/taskModel.ts` puro.
2. Migrar normalizacao de Local para esse modulo.
3. Espelhar ou compartilhar regras com Convex sem dependencias de browser.
4. Reduzir duplicacao entre `localTasks.ts` e `convex/tasks.ts`.

### Etapa 3 - Acessibilidade e robustez

1. Refatorar `SidebarCard` para nao aninhar botao dentro de elemento com `role="button"`.
2. Validar `localStorage`.
3. Adicionar pending/error states nas acoes.
4. Evoluir Dialog ou trocar por Radix/shadcn real.

### Etapa 4 - Estrutura

1. Quebrar `src/main.tsx` em componentes.
2. Quebrar `styles.css` por dominio.
3. Renomear ou implementar `test:flows`.
4. Adicionar testes automatizados para os casos de `FLOW_QA_CASES.md`.

## Checklist de aceite para a proxima versao

- Kanban `Todas` mostra planned/doing/delegated/done de todas as semanas.
- Editar uma concluida nao muda `completedAt`.
- Undo restaura data/status/conclusao de forma fiel.
- Planejar tarefa e uma operacao atomica.
- Mover para backlog tem `Desfazer`.
- Nao existe tarefa `done` efetivamente renderizada como backlog sem explicacao.
- Local e Convex seguem as mesmas regras.
- `localStorage` invalido nao quebra filtros/presets.
- Cards/sidebar sao navegaveis por teclado sem interativo aninhado.
- `test:flows` executa testes reais ou e renomeado.
