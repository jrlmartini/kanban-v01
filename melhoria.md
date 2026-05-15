# Relatorio de melhorias potenciais - FocusFlow Kanban

Auditoria realizada em 14/05/2026 com o app rodando em `http://localhost:5180/`.

## Escopo auditado

- Documentacao do produto e historico funcional: `README.md`, `readme-kanban.md`, `UI-Fluxos-Interacoes-Dashboard-Kanban.md`, `designsystem.md`, `CONVEX_DATA_REQUIREMENTS.md` e revisoes de migracao.
- Implementacao principal: `src/main.tsx`, `src/styles.css`, `src/lib/localTasks.ts`, `src/lib/dates.ts`, `convex/schema.ts` e `convex/tasks.ts`.
- Interface no navegador: abertura do dashboard, cockpit, backlog, modal de atividade, filtros, visao Kanban, visao Semana, seletor semanal e modo e-ink.
- Checagens tecnicas: `npm run build` e `npm run lint`.

Observacao: os testes que criaram atividade temporaria foram feitos em `http://127.0.0.1:5180/`, uma origem separada do `localhost`, para nao alterar os dados locais do quadro principal.

## Resultado geral

O Kanban esta em uma boa base de MVP: a proposta visual esta consistente, a hierarquia e calma, o cockpit ajuda a reduzir carga mental, a alternancia Semana/Kanban funciona e o modelo de tarefa unica esta bem representado. O build e o lint passaram sem erros.

As maiores oportunidades estao em tres grupos:

1. Corrigir alguns atritos de interacao rapida nos cards.
2. Fortalecer acessibilidade, touch/mobile e previsibilidade de estado.
3. Amadurecer recursos esperados para virar um planner padrao de uso diario.

## Prioridade alta

### 1. Corrigir botoes rapidos dos cards

Durante o teste no navegador, clicar em `Iniciar` dentro de um card abriu o modal de edicao e nao moveu a tarefa para `Em andamento`. O esperado seria executar a acao rapida sem abrir detalhes.

Impacto: quebra o fluxo principal do Kanban, porque o usuario tenta fazer uma acao direta e acaba entrando no modo de edicao.

Onde olhar:

- `src/main.tsx`, componente `TaskCard`, nos botoes `Iniciar` e `Concluir`.
- `src/styles.css`, `.card-actions`, porque as acoes ficam absolutas, invisiveis por padrao e dependentes de hover.

Sugestoes:

- Garantir que o clique do botao nao acione o `onClick` do card.
- Considerar mover a abertura do modal para um botao ou area dedicada, deixando as acoes rapidas sempre previsiveis.
- Adicionar teste automatizado cobrindo: criar tarefa planejada, clicar `Iniciar`, verificar coluna `Em andamento`; clicar `Concluir`, verificar coluna `Concluidas`.

### 2. Expor acoes dos cards sem depender apenas de hover

Hoje `Iniciar` e `Concluir` aparecem em hover/focus. Em touch, tablet, e uso com caneta/e-ink, isso reduz descobribilidade.

Impacto: o planner fica mais bonito, mas menos operacional para uso frequente.

Sugestoes:

- Manter uma acao primaria sempre visivel no card, por exemplo um pequeno icone de play/check.
- Em telas pequenas, trocar hover por menu de acoes ou botao fixo compacto.
- Aumentar a area clicavel dos botoes rapidos, hoje visualmente muito pequena.

### 3. Diferenciar melhor tarefa atrasada de tarefa em backlog

O cockpit mostra atrasadas corretamente, mas a relacao entre atrasadas, backlog e semana pode ficar confusa. Uma tarefa planejada em semana anterior aparece como atrasada no cockpit e tambem pode sumir do fluxo principal dependendo do escopo.

Impacto: risco de o usuario perder confianca no painel se nao entender por que uma tarefa aparece em um lugar e nao em outro.

Sugestoes:

- Criar uma secao explicita `Atrasadas` no backlog/sidebar com microcopy clara.
- Permitir replanejar uma atrasada diretamente pelo card, sem abrir modal completo.
- No Kanban, mostrar uma faixa de "Atrasadas fora da semana" ou um filtro rapido.

## Prioridade media

### 4. Melhorar feedback apos criar, salvar, iniciar, concluir e arquivar

As mudancas acontecem, mas sem confirmacao visivel. Para um planner de uso diario, pequenos feedbacks reduzem incerteza.

Sugestoes:

- Toast discreto: `Atividade criada`, `Movida para hoje`, `Concluida`.
- Animacao curta no card quando muda de coluna.
- Em caso de erro Convex, aviso claro com opcao de tentar de novo.

### 5. Adicionar desfazer para acoes destrutivas ou de mudanca rapida

Concluir, voltar ao backlog e arquivar mudam bastante o estado mental do quadro.

Sugestoes:

- `Desfazer` por alguns segundos apos concluir/arquivar/mover.
- Para arquivamento, manter confirmacao, mas tambem oferecer recuperacao em area de historico.

### 6. Fortalecer planejamento sem arrastar

Drag and drop e bom no desktop, mas nao e suficiente para touch, teclado e acessibilidade.

Sugestoes:

- Adicionar menu `Mover para...` no card.
- Permitir escolher dia/status por comandos rapidos no modal.
- Criar atalho de replanejamento em cards atrasados e backlog.

### 7. Ajustar o modo e-ink para diferentes tamanhos

O modo e-ink funciona e tem excelente potencial, mas usa quadro fixo de `800x480`.

Impacto: otimo para um dispositivo especifico, menos flexivel em notebook, tablet, impressao ou display maior.

Sugestoes:

- Parametrizar presets: `800x480`, `1024x758`, `print A4`, `tablet`.
- Adicionar escala responsiva com limite maximo.
- Criar opcao de exportar/printar a semana em e-ink.

### 8. Melhorar filtros como ferramenta de foco

O painel de filtros funciona, mas pode ficar mais util como fluxo recorrente.

Sugestoes:

- Salvar ultimo filtro usado, com opcao de limpar.
- Adicionar chips rapidos: `P1`, `Hoje`, `Atrasadas`, `Delegadas`, `Pessoal`, `Profissional`.
- Permitir combinar filtro com cockpit, por exemplo "mostrar so o radar".

### 9. Tornar o cockpit mais acionavel

O cockpit cumpre bem a funcao de destacar o que importa, mas hoje ele e mais leitura do que comando.

Sugestoes:

- Em cada mini-card, permitir concluir, iniciar ou replanejar sem abrir o modal completo.
- Separar `Hoje` em `Em execucao` e `Ainda nao iniciadas`, quando houver volume.
- Adicionar indicador de carga do dia: leve, ok, cheio.

## Prioridade baixa

### 10. Refinar linguagem e consistencia dos nomes

Alguns termos alternam entre `atividade`, `tarefa`, `radar`, `ocultas`, `painel`, `backlog`.

Sugestoes:

- Definir vocabulario oficial: provavelmente `atividade` para o objeto e `tarefa` apenas quando for linguagem natural.
- Trocar `ocultas` por algo menos ambiguo, como `fora do radar`.
- Explicar `Local`/`Convex` com tooltip, para usuario nao tecnico.

### 11. Melhorar acessibilidade sem perder densidade

Pontos positivos: botoes tem nomes acessiveis, estrutura semantica esta razoavel, foco visual existe.

Sugestoes:

- Garantir navegacao completa por teclado para mover tarefas.
- Usar `aria-pressed` nos segmented controls.
- Anunciar mudancas de coluna/status para leitores de tela.
- Revisar contraste dos textos mais sutis em cards e mini-cards.

### 12. Criar estados vazios mais especificos

O texto `Solte uma tarefa aqui` aparece em varias colunas, inclusive quando o usuario nao esta arrastando.

Sugestoes:

- `Nada planejado aqui`, `Nenhuma delegada`, `Nenhuma concluida ainda`.
- Durante drag, ai sim trocar para `Solte aqui`.

### 13. Evoluir metricas sem transformar em dashboard pesado

A barra de progresso semanal e util, mas pode ficar mais informativa.

Sugestoes:

- Mostrar concluidas / planejadas / atrasadas em micro-resumo.
- Calcular `carga restante` por dia.
- Preservar tom calmo, sem gamificacao excessiva.

## Sugestoes tecnicas

### 14. Criar testes automatizados de fluxo

Fluxos principais a cobrir:

- Criar tarefa sem data e confirmar que entra no backlog.
- Planejar tarefa para hoje e confirmar cockpit + coluna correta.
- Iniciar tarefa e confirmar status `doing`.
- Concluir tarefa e confirmar `completedAt` + progresso semanal.
- Alternar semana e confirmar que escopo do Kanban respeita `plannedWeek`.
- Mover tarefa para backlog e confirmar limpeza de `plannedWeek`, `plannedDay` e `completedAt`.

Implementado nesta rodada:

- Casos de regressao consolidados em `FLOW_QA_CASES.md`.
- Ainda falta instalar/adotar um runner de testes de UI para transformar esses casos em automacao executavel.

### 15. Separar componentes grandes de `src/main.tsx`

O arquivo principal concentra app, modal, cockpit, kanban, semana, filtros, calendario e helpers.

Sugestoes:

- `components/Cockpit.tsx`
- `components/KanbanView.tsx`
- `components/WeekView.tsx`
- `components/TaskModal.tsx`
- `components/WeekPicker.tsx`
- `lib/taskRules.ts` para `getEffectiveStatus`, atrasos, filtros e sumarizacao.

Beneficio: fica mais facil testar regras e evoluir UI sem mexer em tudo ao mesmo tempo.

Implementado nesta rodada:

- Regras puras movidas para `src/lib/taskRules.ts`.
- Componentes visuais continuam no `src/main.tsx` para evitar uma refatoracao grande demais junto com mudancas de comportamento.

### 16. Usar indices Convex nas queries futuras

Hoje a query lista tudo e filtra/ordena em memoria. Para MVP esta ok, mas pode pesar com historico grande.

Sugestoes:

- Queries por semana, status, backlog e arquivadas.
- Paginacao ou limite para historico.
- Query especifica para cockpit.

### 17. Reavaliar regra de `done` sem data

Pelo `getEffectiveStatus`, tarefa sem `plannedDay` vira efetivamente `backlog`, mesmo se o status bruto for `done`. Isso protege o modelo semanal, mas pode confundir em historico/importacao.

Sugestoes:

- Definir se uma tarefa concluida sem data deve existir.
- Se existir, exibir em historico/concluidas sem planejamento.
- Se nao existir, validar na mutacao e no formulario.

## Ideias de produto para proximas iteracoes

- Templates de tarefa recorrente semanal.
- `Energia` ou `tipo de foco`: profundo, administrativo, pessoal, ligacao, externo.
- Agrupamento por projeto sem virar sistema pesado de projetos.
- Modo "Hoje": apenas tarefas de hoje + atrasadas + delegadas criticas.
- Revisao semanal guiada: o que ficou atrasado, o que vai para a proxima semana, o que arquivar.
- Captura rapida por texto natural: `sexta 10h revisar proposta P1`.
- Area de historico/arquivo com restaurar.

## Checklist de validacao executado

- App abriu em `localhost:5180`.
- Console sem erros ou warnings relevantes durante a navegacao testada.
- Cockpit carregou contadores e cards.
- Criacao de atividade sem data funcionou em origem isolada.
- Planejamento para hoje via modal funcionou em origem isolada.
- Alternancia Kanban/Semana funcionou.
- Seletor semanal abriu e exibiu semanas ISO de maio/2026.
- Modo e-ink abriu e voltou corretamente.
- `npm run build` passou.
- `npm run lint` passou.

## Resumo executivo

O modelo visual esta forte e ja tem personalidade suficiente para virar padrao. A principal correcao antes de evoluir recursos e garantir que as acoes rapidas dos cards sejam confiaveis. Depois disso, eu priorizaria: replanejamento rapido de atrasadas, alternativas ao drag and drop, feedback/desfazer e refinamento responsivo do e-ink.
