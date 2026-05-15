---
type: functional-spec
system: kanban-dashboard
page: pagina-principal
scope: atividades-criacao-edicao-fluxo
source: dashboard/app.js + dashboard/server.mjs
created: 2026-05-13
status: reference
---

# Lógica funcional — Atividades no Dashboard / Kanban

> Nota de 2026-05-15: este documento registra a lógica da fase Obsidian/Markdown. Para decisões atuais de modelo Convex, schema, normalização, atraso e backlog, use `CONVEX_DATA_REQUIREMENTS.md` como fonte principal e `MIGRACAO_CONVEX_REVISAO_FUNCIONAL.md` como complemento.

Esta nota descreve a visão funcional da página principal do dashboard/Kanban: como atividades são lidas, criadas, editadas, filtradas, movidas, concluídas e arquivadas.

A nota anterior descreve a aparência. Esta descreve o **comportamento operacional**.

---

# 1. Princípio funcional central

O dashboard não é uma lista passiva de tarefas.

Ele é um **cockpit de execução sobre arquivos Markdown do Obsidian**.

A função dele é:

1. capturar atividade rápido;
2. dar status operacional claro;
3. separar foco real de ruído;
4. permitir replanejamento por arrastar/soltar;
5. manter o Obsidian como fonte da verdade;
6. permitir edição sem quebrar o Markdown.

Regra-mãe:

> Toda atividade visível no dashboard é um arquivo Markdown com frontmatter YAML e corpo estruturado.

---

# 2. Fonte da verdade

O dashboard lê e escreve no vault:

```text
/home/node/.openclaw/workspace/obsidian
```

As atividades vivem em:

```text
obsidian/Activities/Active/
obsidian/Activities/Done/
obsidian/Activities/Archived/
obsidian/Activities/Inbox/
```

O servidor carrega apenas arquivos `.md` cujo frontmatter tenha:

```yaml
kind: activity
```

Arquivos sem `kind: activity` são ignorados pela lógica de atividades.

---

# 3. Estrutura de uma atividade

Cada atividade tem frontmatter com campos principais:

```yaml
id: ACT-2026-0001
kind: activity
title: Título da atividade
type: professional
status: backlog
priority: normal
planned_date:
planned_week:
planned_day:
created: 2026-05-13
due:
owner: ze
delegated_to:
project:
tags: []
definition_of_done:
completed_at:
archived_at:
updated: 2026-05-13
revision: 1
```

E corpo Markdown com seções:

```markdown
# Título da atividade

## Contexto
...

## Próximo passo
...

## Checklist
- [ ]

## Histórico
- 2026-05-13 criado pelo dashboard
```

## Campos funcionais importantes

### `id`

Identificador único gerado automaticamente no formato:

```text
ACT-ANO-000N
```

Exemplo:

```text
ACT-2026-0004
```

### `title`

Nome da atividade. É obrigatório no modal. Se tentar salvar sem título, nada acontece.

### `type`

Pode ser:

```text
professional
personal
```

Na interface aparece como:

```text
Profissional
Pessoal
```

### `status`

Pode ser:

```text
backlog
todo
doing
delegated
done
```

Na interface aparece como:

```text
Backlog
Não iniciada
Em andamento
Delegada
Concluída
```

### `priority`

Pode ser:

```text
low
normal
medium
high
critical
```

Na interface aparece como:

```text
P4 · Opcional
P3 · Normal
P2 · Importante
P1 · Crítica
```

Observação: `medium` é tratado como equivalente a `normal`.

### `planned_date`

Data específica da atividade no formato:

```text
YYYY-MM-DD
```

Exemplo:

```text
2026-05-13
```

### `planned_week`

Semana ISO calculada a partir da data:

```text
YYYY-WNN
```

Exemplo:

```text
2026-W20
```

### `planned_day`

Dia operacional da semana:

```text
monday
tuesday
wednesday
thursday
friday
weekend
```

Sábado e domingo caem no bucket único:

```text
weekend
```

---

# 4. Carregamento das atividades

Ao abrir a página, o frontend chama:

```text
GET /api/activities
```

O servidor:

1. percorre `Activities/Active`, `Done`, `Archived` e `Inbox`;
2. lê arquivos Markdown;
3. parseia o YAML frontmatter;
4. ignora arquivos que não são `kind: activity`;
5. extrai dados do corpo;
6. devolve JSON para a interface.

## Campos derivados do corpo Markdown

O servidor extrai:

### `context_excerpt`

Vem da seção:

```markdown
## Contexto
```

É limitado a aproximadamente 240 caracteres.

### `next_step`

Vem da seção:

```markdown
## Próximo passo
```

Também limitado a aproximadamente 240 caracteres.

## Ordenação padrão

As atividades são ordenadas por:

1. prioridade mais alta primeiro;
2. dia planejado da semana;
3. data de criação.

Ranking de prioridade:

```text
critical > high > normal/medium > low
```

Ranking de dias:

```text
segunda > terça > quarta > quinta > sexta > fim de semana
```

---

# 5. Estados de exibição

O frontend mantém estado local para controlar a página.

Estado inicial funcional:

```text
view: kanban
kanbanScope: cockpit
sidebarCollapsed: false
sidebarFilter: all
filtersOpen: false
search: vazio
filters: todos
week: semana ISO atual
modal: null
displayMode: standard
```

## Visualizações

Existem duas visualizações principais:

```text
Semana
Kanban
```

### Kanban

Agrupa atividades por status:

```text
Backlog | Não iniciada | Em andamento | Delegada | Concluída
```

### Semana

Agrupa atividades por dia operacional:

```text
Segunda | Terça | Quarta | Quinta | Sexta | Fim de semana
```

Dentro de cada dia, as atividades são subdivididas por status.

---

# 6. Escopos do Kanban

Quando a visualização é Kanban, há três escopos.

## 6.1 Cockpit

É o padrão.

Mostra apenas atividades operacionalmente relevantes.

Uma atividade entra no Cockpit se:

1. ainda está pendente;
2. não está arquivada;
3. e cumpre pelo menos uma condição:
   - status `doing`;
   - status `delegated`;
   - prioridade `critical`;
   - está atrasada;
   - está planejada para os próximos 14 dias;
   - não tem data e está em backlog.

Objetivo: impedir que o Kanban vire inventário de tudo.

## 6.2 Esta semana

Mostra:

- atividades da semana selecionada;
- atividades parecidas com backlog;
- atividades sem planejamento claro;
- atividades atrasadas.

Objetivo: permitir planejamento semanal sem perder o que está solto.

## 6.3 Todas

Mostra todas as atividades visíveis pelos filtros, exceto arquivadas.

Objetivo: auditoria geral.

Não deve ser o modo padrão, porque gera ruído.

---

# 7. Cockpit de execução

O bloco superior de cockpit calcula buckets automaticamente.

## Buckets

### Hoje

Atividades pendentes com:

```text
planned_date = data de hoje
```

### Atrasadas

Atividades pendentes com:

- `planned_date` anterior a hoje; ou
- `planned_week` anterior à semana atual.

Atividades concluídas não contam como atrasadas.

### Delegadas

Atividades pendentes com:

```text
status: delegated
```

### Próx. 14 dias

Atividades pendentes com data entre hoje e os próximos 14 dias, excluindo:

- atividades de hoje;
- atividades atrasadas.

## Contador de relevância

O cockpit mostra:

```text
X relevantes
Y fora do painel
```

Onde:

- `relevantes` = atividades pendentes que passam no critério operacional do Cockpit;
- `fora do painel` = pendentes que existem, mas não merecem foco imediato.

---

# 8. Sidebar de backlog

A sidebar não é apenas visual. Ela é um mecanismo para separar trabalho solto do fluxo principal.

## Entra na sidebar se a atividade for backlog-like

Critério:

- status `backlog`; ou
- não tem `planned_week`; ou
- não tem `planned_day`; ou
- está atrasada.

## Abas

### Todos

Mostra atrasadas + backlog/sem data.

### Atrasadas

Mostra só atividades atrasadas.

### Backlog

Mostra atividades sem data/backlog que não estão atrasadas.

## Colapsar sidebar

A sidebar pode ser recolhida para liberar foco visual.

Quando recolhida, mantém apenas:

- contador;
- label vertical `Backlog`.

---

# 9. Criação de nova atividade

A criação começa no botão:

```text
Nova atividade
```

Isso abre o modal vazio com padrões:

```yaml
title: ""
type: professional
status: backlog
priority: normal
planned_date: null
planned_week: null
planned_day: null
next_step: ""
```

## Campos disponíveis no modal

- Título
- Tipo
- Status
- Prioridade
- Data
- Próximo passo

## Validação mínima

Se o título estiver vazio, a atividade não é criada.

## Ao salvar

O frontend envia:

```text
POST /api/activities
```

Com payload semelhante a:

```json
{
  "title": "Revisar proposta",
  "type": "professional",
  "status": "todo",
  "priority": "normal",
  "planned_date": "2026-05-13",
  "planned_week": "2026-W20",
  "planned_day": "wednesday",
  "next_step": "Abrir documento e revisar premissas comerciais."
}
```

O servidor então:

1. cria a pasta `Activities/Active`, se necessário;
2. gera novo ID;
3. monta o frontmatter;
4. cria o corpo Markdown padrão;
5. salva o arquivo em `Activities/Active`;
6. dispara atualização em tempo real.

## Nome do arquivo criado

O arquivo é salvo como:

```text
ACT-ANO-000N-slug-do-titulo.md
```

Exemplo:

```text
ACT-2026-0004-revisar-proposta.md
```

## Regra importante de status na criação

Se a atividade tiver data (`planned_date`):

- status vira o status escolhido, ou `todo` como fallback.

Se a atividade não tiver data:

- status vira `backlog`.

Isso evita atividade sem data aparecendo como tarefa falsa no fluxo semanal.

---

# 10. Data, semana e dia operacional

A data no modal é escolhida por calendário.

Ao selecionar uma data, o sistema calcula automaticamente:

```yaml
planned_date: YYYY-MM-DD
planned_week: YYYY-WNN
planned_day: monday/tuesday/wednesday/thursday/friday/weekend
```

Se a atividade estava em `backlog`, ao receber data ela muda para:

```yaml
status: todo
```

## Botão Hoje no modal

Define:

- `planned_date` = hoje;
- `planned_week` = semana atual;
- `planned_day` = dia correspondente;
- se estava em backlog, status muda para `todo`.

## Botão Sem data

Limpa:

```yaml
planned_date: null
planned_week: null
planned_day: null
status: backlog
```

Regra: sem data volta para backlog.

---

# 11. Edição de atividade

Clicar em qualquer card abre o modal com os dados da atividade.

Ao salvar uma atividade existente, o frontend envia:

```text
PATCH /api/activities/:id
```

O servidor:

1. encontra a atividade pelo `id`;
2. lê o arquivo Markdown;
3. valida os campos recebidos;
4. atualiza o frontmatter;
5. atualiza seções do corpo quando necessário;
6. incrementa `revision`;
7. atualiza `updated`;
8. salva o arquivo.

## Atualização do próximo passo

O campo `Próximo passo` no modal altera a seção:

```markdown
## Próximo passo
```

Se a seção não existir, ela é criada.

## Atualização de contexto

A API também suporta atualizar:

```markdown
## Contexto
```

Mesmo que a interface principal hoje dê mais destaque ao próximo passo.

---

# 12. Concluir atividade

Existem duas formas principais:

1. mudar status para `Concluída` no Kanban/modal;
2. clicar no botão `Concluir` dentro do modal.

Funcionalmente, isso chama:

```text
POST /api/activities/:id/complete
```

Ou um `PATCH` com:

```json
{ "status": "done" }
```

O servidor:

1. define `status: done`;
2. grava `completed_at`, se ainda não existir;
3. atualiza `updated`;
4. incrementa `revision`;
5. move o arquivo para:

```text
Activities/Done/
```

A atividade concluída deixa de contar como pendente e não entra como atrasada.

---

# 13. Arquivar atividade

O modal tem botão:

```text
Arquivar
```

Antes de arquivar, a interface pede confirmação:

```text
Arquivar esta atividade? Ela sai do dashboard ativo, mas continua preservada no Obsidian.
```

Se confirmado, chama:

```text
POST /api/activities/:id/archive
```

O servidor:

1. grava `archived_at`, se ainda não existir;
2. atualiza `updated`;
3. incrementa `revision`;
4. move o arquivo para:

```text
Activities/Archived/
```

Atividades arquivadas não aparecem no dashboard ativo.

---

# 14. Drag and drop

Cards são arrastáveis.

## Arrastar para coluna Kanban

Ao soltar em uma coluna, o sistema altera:

```yaml
status: coluna_destino
```

Exemplo:

- soltar em `Em andamento` → `status: doing`;
- soltar em `Delegada` → `status: delegated`;
- soltar em `Concluída` → `status: done` e move para `Done`.

## Arrastar para dia da semana

Na visualização Semana, soltar em um dia define:

```yaml
planned_week: semana selecionada
planned_day: dia escolhido
planned_date: data calculada
```

Para segunda a sexta, calcula a data exata.

Para `weekend`, define `planned_day: weekend`; a data específica pode não ser atribuída do mesmo jeito que dias úteis.

## Regra especial para backlog

Se uma atividade em backlog for solta em um dia da semana, ela passa para:

```yaml
status: todo
```

Ou seja: planejar uma atividade tira ela do backlog e transforma em tarefa não iniciada.

---

# 15. Filtros e busca

Filtros são aplicados no frontend sobre as atividades ativas.

Antes dos filtros, o sistema remove arquivadas.

## Busca textual

Busca em:

- título;
- resumo de contexto;
- próximo passo;
- projeto;
- dono;
- delegado;
- tags.

## Filtros estruturados

- Tipo: todos/profissional/pessoal.
- Prioridade: todas/P4/P3/P2/P1.
- Status: todos/backlog/todo/doing/delegated/done.

## Contagem

O filtro mostra:

```text
X de Y
```

Onde:

- `X` = atividades visíveis após filtros;
- `Y` = total de atividades ativas antes dos filtros.

---

# 16. Atualização em tempo real

O sistema tem atualização quase em tempo real.

## No servidor

O servidor observa mudanças nas pastas:

```text
Activities/Active
Activities/Done
Activities/Archived
Activities/Inbox
```

Quando algo muda, agenda um broadcast com debounce de aproximadamente 300ms.

## No frontend

O frontend escuta:

```text
GET /api/events
```

via Server-Sent Events.

Quando recebe `vault-change`, recarrega atividades.

## Fallback

Além do SSE, há fallback:

- se der erro, tenta recarregar em ~1,5s;
- independentemente disso, recarrega atividades a cada 30s.

---

# 17. Regras de segurança funcional

## Validação de campos

O servidor valida os campos recebidos.

Status inválido vira:

```text
backlog
```

Tipo inválido vira:

```text
professional
```

Prioridade inválida vira:

```text
normal
```

Dia inválido vira `null`.

Data inválida fora do padrão `YYYY-MM-DD` vira `null`.

## Sem data = backlog

Se `planned_date` for removida, o servidor também limpa:

```yaml
planned_week: null
planned_day: null
status: backlog
```

Essa regra protege o sistema contra tarefa “fantasma” sem data e fora do backlog.

## Arquivar é preservação, não deleção

Arquivar move o arquivo para `Activities/Archived`, mas não apaga.

## Concluir move, não apaga

Concluir move para `Activities/Done`, mas mantém o Markdown.

---

# 18. Comportamentos de interface úteis

## Escape

A tecla `Escape`:

- fecha modal, se modal estiver aberto;
- fecha calendários/popovers, se estiverem abertos.

## Clique fora

- Clique fora do modal fecha o modal.
- Clique fora de calendário fecha o calendário.

## Relógio

O relógio atualiza a cada 60 segundos.

## Modo e-ink

O modo e-ink é persistido no navegador via `localStorage`.

---

# 19. API funcional

## Health

```text
GET /api/health
```

Retorna se o serviço está ok e quais pastas está usando.

## Listar atividades

```text
GET /api/activities
```

Aceita filtros de query:

```text
type
status
priority
planned_week
planned_day
week
```

## Criar atividade

```text
POST /api/activities
```

Cria arquivo Markdown em `Activities/Active`.

## Editar atividade

```text
PATCH /api/activities/:id
```

Atualiza frontmatter e, quando aplicável, seções do corpo.

## Concluir

```text
POST /api/activities/:id/complete
```

Marca como concluída e move para `Activities/Done`.

## Arquivar

```text
POST /api/activities/:id/archive
```

Marca como arquivada e move para `Activities/Archived`.

## Agrupar por status

```text
GET /api/activities/grouped/status
```

## Agrupar por semana/dia/status

```text
GET /api/activities/grouped/week
```

## Eventos em tempo real

```text
GET /api/events
```

---

# 20. Fluxos principais resumidos

## Criar atividade rápida sem data

1. Clica `Nova atividade`.
2. Preenche título.
3. Opcionalmente preenche prioridade e próximo passo.
4. Salva.
5. Sistema cria arquivo em `Active`.
6. Atividade entra como `backlog`.
7. Aparece na sidebar/backlog.

## Criar atividade com data

1. Clica `Nova atividade`.
2. Preenche título.
3. Escolhe data.
4. Sistema calcula semana e dia.
5. Se estava em backlog, muda para `todo`.
6. Salva.
7. Atividade aparece na semana e/ou Kanban conforme escopo.

## Planejar uma atividade existente

1. Arrasta card do backlog para um dia da semana.
2. Sistema define semana/dia/data.
3. Se era backlog, vira `todo`.
4. Arquivo Markdown é atualizado.
5. Interface recarrega.

## Mover fluxo de execução

1. Arrasta card entre colunas.
2. Sistema altera `status`.
3. Se coluna for `Concluída`, move arquivo para `Done`.
4. Interface recarrega.

## Tirar do painel ativo sem perder histórico

1. Abre card.
2. Clica `Arquivar`.
3. Confirma.
4. Sistema move para `Archived`.
5. Sai do dashboard ativo.

---

# 21. O que copiar para outro dashboard

Se for recriar em outra stack, preservar estas decisões:

1. **Markdown/Obsidian como fonte da verdade**.
2. **Atividade = frontmatter estruturado + corpo humano-legível**.
3. **Sem data = backlog automaticamente**.
4. **Dar data tira do backlog e vira `todo`**.
5. **Concluir move para Done, não apaga**.
6. **Arquivar move para Archived, não apaga**.
7. **Cockpit é filtro de relevância, não lista completa**.
8. **Sidebar segura o backlog para não poluir o fluxo principal**.
9. **Drag and drop altera estado real, não só visual**.
10. **Próximo passo é campo de primeira classe**.

A lógica que faz o dashboard funcionar é esta:

> Captura livre no backlog, planejamento transforma em execução, execução muda status, conclusão/arquivo preservam histórico.
