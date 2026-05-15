# FocusFlow Kanban TDAH

Primeiro módulo de planejamento semanal com Cockpit, Backlog, Semana, Kanban e visão e-ink.

A fonte da verdade é uma única tabela `tasks` no Convex. Semana, Kanban, Cockpit, Backlog e e-ink são visões derivadas da mesma tarefa.

Regra principal:

> Backlog é o que está fora do calendário. Kanban é o fluxo do que já entrou na semana.

## Rodar localmente

```bash
npm install
npm run dev
```

Para validar lint e build:

```bash
npm run check
```

Para usar o Convex:

```bash
npm run convex:dev
```

Depois defina `VITE_CONVEX_URL` em `.env.local`.

## Estrutura

- [src/main.tsx](/Users/jrlmartini/DEV-Projects/Kanban-V02/src/main.tsx): app, views Semana/Kanban e regras de interação.
- [src/lib/taskRules.ts](/Users/jrlmartini/DEV-Projects/Kanban-V02/src/lib/taskRules.ts): regras puras de status efetivo, atraso, filtros e cockpit.
- [src/styles.css](/Users/jrlmartini/DEV-Projects/Kanban-V02/src/styles.css): tokens e layout dark-first baseados em `designsystem.md`.
- [convex/schema.ts](/Users/jrlmartini/DEV-Projects/Kanban-V02/convex/schema.ts): tabela `tasks` e índices.
- [convex/tasks.ts](/Users/jrlmartini/DEV-Projects/Kanban-V02/convex/tasks.ts): queries e mutations.
- [CONVEX_DATA_REQUIREMENTS.md](/Users/jrlmartini/DEV-Projects/Kanban-V02/CONVEX_DATA_REQUIREMENTS.md): necessidades da base Convex.
- [MIGRACAO_CONVEX_REVISAO_FUNCIONAL.md](/Users/jrlmartini/DEV-Projects/Kanban-V02/MIGRACAO_CONVEX_REVISAO_FUNCIONAL.md): revisão da lógica Obsidian e decisões para migrar sem perder o comportamento funcional.

## Escopo desta versão

- Captura rápida.
- Backlog com tarefas sem data e atrasadas de semanas anteriores para replanejamento.
- Cockpit operacional.
- Planejamento da semana.
- Distribuição por dias.
- Kanban com Não iniciadas, Em andamento, Delegadas e Concluídas.
- Conclusão com `completedAt`.
- Arquivamento com `archivedAt` e restauração por `restore`.
- Feedback por toast com desfazer.
- Modo e-ink com presets.

Ficam fora desta versão: projetos, tags, bloqueios avançados, comentários, recorrência e histórico/auditoria completos.
