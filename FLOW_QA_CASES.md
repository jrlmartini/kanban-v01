# Flow QA cases

Este arquivo lista os fluxos que devem virar testes automatizados quando o projeto receber Playwright, Vitest ou outro runner.

Enquanto isso, ele funciona como checklist de regressao antes de mexer em Convex, drag and drop, modal ou regras de backlog.

## Casos obrigatorios

### 1. Criar atividade sem data

Resultado esperado:

- status efetivo vira `backlog`;
- `plannedWeek` fica vazio;
- `plannedDay` fica vazio;
- aparece na sidebar de backlog;
- nao aparece na visao semanal nem no Kanban.

### 2. Planejar atividade para hoje

Resultado esperado:

- recebe `plannedDay` de hoje;
- recebe `plannedWeek` da semana ISO atual;
- status efetivo vira `planned`, se estava em backlog;
- planejamento acontece em uma unica operacao atomica;
- aparece no Cockpit > Hoje;
- aparece na coluna `Nao iniciadas`.

### 3. Iniciar atividade pelo card

Resultado esperado:

- clicar `Iniciar` nao abre modal;
- status vira `doing`;
- card vai para `Em andamento`;
- toast confirma a mudanca;
- `Desfazer` restaura o snapshot anterior, incluindo data/status/conclusao.

### 4. Concluir atividade pelo card

Resultado esperado:

- clicar `Concluir` nao abre modal;
- status vira `done`;
- `completedAt` e preenchido;
- progresso semanal aumenta;
- editar uma concluida nao altera `completedAt`;
- `Desfazer` restaura o snapshot anterior, incluindo `completedAt`.

### 5. Mover para backlog

Resultado esperado:

- status vira `backlog`;
- `plannedWeek`, `plannedDay` e `completedAt` sao limpos;
- aparece na sidebar;
- some da semana e do Kanban.
- toast oferece `Desfazer` para restaurar o snapshot anterior.

### 6. Atrasada da semana em andamento

Resultado esperado:

- tarefa com `plannedDay` anterior a hoje, mas dentro da semana em andamento, nao aparece na sidebar > Atrasadas;
- se estiver com status `planned`, aparece em `Nao iniciadas`;
- continua aparecendo na visao semanal no dia planejado;
- pode mudar de status no Kanban sem exigir reprogramacao.

### 7. Reprogramar atrasada de semana anterior

Resultado esperado:

- tarefa com `plannedDay` anterior a hoje e fora da semana em andamento aparece na sidebar > Atrasadas;
- nao fica solta no Kanban ativo;
- clicar `Planejar` abre o modal de planejamento;
- escolher dia tira da aba Atrasadas e recoloca na semana.

### 8. Alternar semana

Resultado esperado:

- Kanban com escopo `Esta semana` mostra apenas tarefas da semana selecionada;
- Kanban com escopo `Todas` mostra tarefas `planned`, `doing`, `delegated` e `done` de todas as semanas;
- visao semanal agrupa por dia da semana selecionada;
- backlog sem data continua visivel.
- navegar para semana futura ou passada nao muda artificialmente quais tarefas sao atrasadas.

### 9. Arquivar e desfazer

Resultado esperado:

- arquivar remove a atividade do dashboard ativo;
- toast oferece `Desfazer`;
- desfazer restaura a atividade.

### 10. Filtros rapidos

Resultado esperado:

- chips `P1`, `Hoje`, `Delegadas`, `Pessoal`, `Profissional` filtram a lista;
- filtros persistem ao recarregar;
- `Limpar` reseta todos.

### 11. Acessibilidade basica

Resultado esperado:

- segmented controls usam `aria-pressed`;
- toast anuncia mudancas com `aria-live`;
- modal fecha com `Esc`;
- cards e acoes rapidas podem ser acessados por teclado.
