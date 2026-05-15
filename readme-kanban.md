# Kanban TDAH — MVP de Planejamento Semanal

> Nota de 2026-05-14: este arquivo e um documento historico de concepcao. Para editar modelo Convex, schema, importacao ou regras atuais de dados, use `CONVEX_DATA_REQUIREMENTS.md` como fonte principal e `MIGRACAO_CONVEX_REVISAO_FUNCIONAL.md` como complemento. Regras antigas deste arquivo, como "planejada para a semana sem dia" ou bucket separado de concluidas na visao semanal, nao representam mais a decisao atual do produto.

## 1. Objetivo do primeiro módulo

Criar um planejador semanal simples, persistente e com baixa carga mental.

O sistema deve permitir que o usuário:

1. Capture tarefas rapidamente.
2. Mantenha tarefas não planejadas em um backlog.
3. Selecione tarefas para a semana atual.
4. Me permita distribuir tarefas entre os dias da semana.
5. Acompanhe o status de execução em uma visão Kanban.
6. Alterne entre visão semanal e Kanban sem perder consistência.

A regra principal é:

> A tarefa é única. O que muda é apenas a forma de visualização.

Ou seja: não existe uma tarefa “na semana” e outra “no Kanban”. Existe uma tarefa só, com campos de status e planejamento.

---

## 2. Escopo do MVP

Para a primeira versão, o sistema deve usar apenas quatro estados:

```text
backlog
planned
doing
delegated
done
```

Neste primeiro momento, não incluir:

- bloqueio;
- follow-up;
- métricas;
- comentários.

Essas funcionalidades são importantes, mas devem entrar em ciclos futuros.

A primeira vitória do sistema é:

> Capturar, planejar a semana, mover tarefas, iniciar e concluir — com tudo persistente entre Kanban e Semana.

---

## 3. Status iniciais

### 3.1 `backlog`

Tarefa válida, mas ainda não planejada para a semana.

Exemplos:

```text
Revisar proposta do projeto X
Pensar estrutura do novo dashboard
Comprar material para o escritório
```

Uma tarefa em backlog normalmente não tem semana nem dia definido.

Exemplo:

```json
{
  "status": "backlog",
  "plannedWeek": null,
  "plannedDay": null
}
```

---

### 3.2 `planned`

Tarefa escolhida para a semana.

Ela pode estar selecionada para a semana, mas ainda sem dia definido:

```json
{
  "status": "planned",
  "plannedWeek": "2026-W20",
  "plannedDay": null
}
```

Ou pode estar alocada em um dia específico:

```json
{
  "status": "planned",
  "plannedWeek": "2026-W20",
  "plannedDay": "2026-05-14"
}
```

---

### 3.3 `doing`

Tarefa em execução.

Ela continua podendo ter `plannedWeek` e `plannedDay`.

Exemplo:

```json
{
  "status": "doing",
  "plannedWeek": "2026-W20",
  "plannedDay": "2026-05-14"
}
```

---

### 3.4 `done`

Tarefa concluída.

Ao concluir, preencher `completedAt`.

Exemplo:

```json
{
  "status": "done",
  "completedAt": 1778760000000
}
```

---

---

### 3.5 `delegated`

Tarefa delegada.


Exemplo:

```json
{
  "status": "delegated",
  "completedAt": 1778760000000
}
```

---

## 4. Conceito central do modelo

O sistema deve separar duas dimensões diferentes:

1. Status operacional.
2. Planejamento semanal.

### 4.1 Status operacional

Responde:

```text
Em que estado essa tarefa está?
```

Exemplos:

```text
backlog
planned
doing
done
```

### 4.2 Planejamento semanal

Responde:

```text
Essa tarefa está planejada para qual semana?
Está em qual dia?
```

Campos principais:

```text
plannedWeek
plannedDay
```

Essa separação é o que garante que as visões de Kanban e Semana permaneçam sincronizadas.

---

## 5. Visão Semana

A visão semanal deve mostrar as tarefas organizadas no tempo. Deve ser possível navegar para semanas futuras e passadas, ver o que está em cada semana.
Tarefas atrasadas de semanas anteriores também devem aparecer no backlog, com a tag de atrasada.

Áreas recomendadas:

```text
Backlog / Não planejadas e Atrasadas
Segunda
Terça
Quarta
Quinta
Sexta
Sábado
Domingo
Concluídas da semana - deve ficar em um bucket fora da programação semanal.
```

### 5.1 Backlog / Não planejadas / Atrasadas

Mostra tarefas com:

```json
{
  "status": "backlog",
  "plannedWeek": null,
  "plannedDay": null
}
```

Essa área pode aparecer como uma lateral ou uma seção recolhível, para não dominar a tela. Também deve mostrar tarefas não concluídas em semanas anteriores.

Essa área é importante para evitar que o usuário seja obrigado a colocar uma tarefa em um dia falso apenas para lembrar dela.

---

### 5.3 Dias da semana

Cada dia deve mostrar tarefas com:

```json
{
  "plannedWeek": "2026-W20",
  "plannedDay": "2026-05-14"
}
```

A tarefa pode estar com status:

```text
planned
doing
done
delegated
```

Na visão semanal, o status deve aparecer como indicador visual, mas o agrupamento principal é por dia.

---

### 5.4 Concluídas da semana

Mostra tarefas concluídas dentro da semana atual, em um bucket separado, talvez abaixo do kanban da semana.

Critério:

```text
status = done
completedAt dentro da semana atual
```

Essa área deve ser discreta, mas visível o suficiente para gerar sensação de progresso.

---

## 6. Visão Kanban

A visão Kanban deve organizar as mesmas tarefas por status.

Colunas iniciais:

```text
Backlog
Planejadas
Em andamento
Delegadas
Concluídas
```

### 6.1 Coluna Backlog

Mostra:

```json
{
  "status": "backlog"
}
```

---

### 6.2 Coluna Planejadas

Mostra tarefas com:

```json
{
  "status": "planned",
  "plannedWeek": "2026-W20"
}
```

Inclui tanto tarefas com dia definido quanto tarefas ainda sem dia.

---

### 6.3 Coluna Em andamento

Mostra:

```json
{
  "status": "doing"
}
```

Na primeira versão, pode mostrar todas as tarefas em andamento.

Em uma evolução futura, pode haver filtro por semana atual.

---

### 6.4 Coluna Concluídas

Mostra:

```json
{
  "status": "done"
}
```

Preferencialmente, exibir apenas as concluídas da semana atual para não poluir a tela.

---


--

### 6.5 Coluna Delegadas

Mostra:

```json
{
  "status": "delegadas"
}
```

Preferencialmente, exibir apenas as delegadas da semana atual para não poluir a tela.

---


## 7. Persistência entre Semana e Kanban

A persistência acontece porque as duas views leem a mesma tabela no Convex.

Exemplo de tarefa no banco:

```json
{
  "title": "Revisar estrutura do Kanban TDAH",
  "status": "planned",
  "plannedWeek": "2026-W20",
  "plannedDay": "2026-05-14"
}
```

Na visão semanal, ela aparece em:

```text
Quinta-feira
```

Na visão Kanban, ela aparece em:

```text
Planejadas
```

Se o usuário arrastar no Kanban de `Planejadas` para `Em andamento`, muda apenas:

```json
{
  "status": "doing"
}
```

Na visão semanal, ela continua na quinta-feira, mas agora com indicador de “em andamento”.

Se o usuário arrastar na visão semanal de quinta para sexta, muda apenas:

```json
{
  "plannedDay": "2026-05-15"
}
```

Na visão Kanban, ela continua em “Em andamento”.

---

## 8. Comportamentos principais

### 8.1 Criar tarefa rápida

Ao criar uma tarefa nova:

```json
{
  "title": "Nova tarefa",
  "status": "backlog",
  "plannedWeek": null,
  "plannedDay": null
}
```

A tarefa entra no backlog. Deve também ter níveis de prioridade e uma seção para descrever a tarefa, caso necessário (Não obrigatório)


---

### 8.2 Mover tarefa do backlog para a semana

Quando o usuário arrasta uma tarefa do backlog para algum status na visão kanban, sem definir dia.

```json
{
  "status": "planned",
  "plannedWeek": null,
  "plannedDay": null
}
```

---

### 8.3 Mover tarefa do backlog para um dia

Quando o usuário arrasta uma tarefa para terça-feira:

```json
{
  "status": "planned",
  "plannedWeek": "2026-W20",
  "plannedDay": "2026-05-12"
}
```

---

### 8.4 Mover tarefa entre dias

Quando o usuário move uma tarefa de um dia para outro, muda apenas:

```json
{
  "plannedDay": "nova_data"
}
```

O status não deve mudar automaticamente.

---

### 8.5 Tirar tarefa de um dia, mas manter na semana

Quando o usuário move uma tarefa para “Esta semana — sem dia”:

```json
{
  "plannedDay": null
}
```

Mantém:

```json
{
  "plannedWeek": "2026-W20",
  "status": "planned"
}
```

---

### 8.6 Tirar tarefa da semana e voltar para backlog

Quando o usuário remove uma tarefa da semana:

```json
{
  "status": "backlog",
  "plannedWeek": null,
  "plannedDay": null
}
```

---

### 8.7 Começar tarefa

Quando o usuário inicia uma tarefa:

```json
{
  "status": "doing"
}
```

O sistema deve atualizar `updatedAt`.

---

### 8.8 Concluir tarefa

Quando o usuário conclui uma tarefa:

```json
{
  "status": "done",
  "completedAt": "now"
}
```

O sistema deve atualizar `updatedAt`.

---

## 9. Campos mínimos da tarefa no Convex

Para este primeiro módulo, a tabela de tarefas deve começar simples.

Campos mínimos recomendados:

```ts
tasks: {
  title: string
  description?: string

  status: "backlog" | "planned" | "doing" | "done"

  priority?: "low" | "normal" | "high" | "critical"

  plannedWeek?: string
  plannedDay?: string

  sortOrder?: number

  createdAt: number
  updatedAt: number
  completedAt?: number
}
```

### 9.1 Observações sobre os campos

#### `title`

Título curto e acionável da tarefa.

Exemplos bons:

```text
Revisar estrutura do Kanban TDAH
Enviar versão final do orçamento
Validar modelo de dados no Convex
```

Evitar títulos vagos como:

```text
Dashboard
FINEP
Ver projeto
```

---

#### `description`

Campo opcional para contexto.

Não deve ser obrigatório na captura rápida.

---

#### `status`

Estado operacional da tarefa.

Valores iniciais:

```text
backlog
planned
doing
done
```

---

#### `priority`

Prioridade opcional.

Valores:

```text
low
normal
high
critical
```

Na primeira versão, pode ser opcional para reduzir fricção.

---

#### `plannedWeek`

Semana planejada.

Formato recomendado:

```text
YYYY-Www
```

Exemplo:

```text
2026-W20
```

---

#### `plannedDay`

Dia planejado.

Formato recomendado:

```text
YYYY-MM-DD
```

Exemplo:

```text
2026-05-14
```

---

#### `sortOrder`

Campo numérico para ordenação manual.

Importante para drag and drop dentro de colunas e dias.

Mesmo que a lógica inicial seja simples, vale incluir esse campo desde o começo.

---

#### `createdAt`

Timestamp de criação.

---

#### `updatedAt`

Timestamp da última alteração.

---

#### `completedAt`

Timestamp de conclusão.

Preenchido apenas quando `status = done`.

---

## 10. Regras de atualização

### 10.1 Alteração feita no Kanban

Mover uma tarefa no Kanban altera o `status`.

Exemplos:

```text
Backlog → Planejadas
planned

Planejadas → Em andamento
doing

Em andamento → Concluídas
done
```

### 10.2 Alteração feita na Semana

Mover uma tarefa na semana altera `plannedWeek` e/ou `plannedDay`.

Exemplos:

```text
Backlog → Terça-feira
plannedWeek = currentWeek
plannedDay = dateOfTuesday
status = planned

Quarta-feira → Sexta-feira
plannedDay = dateOfFriday

Sexta-feira → Esta semana — sem dia
plannedDay = null

Esta semana — sem dia → Backlog
plannedWeek = null
plannedDay = null
status = backlog
```

---

## 11. UX esperada

A experiência deve ser:

```text
simples
calma
direta
rápida
com pouca fricção
```

O sistema deve ajudar o usuário a responder rapidamente:

1. O que ainda não planejei?
2. O que escolhi para esta semana?
3. O que está em cada dia?
4. O que está em andamento?
5. O que já concluí?

### 11.1 Regras para reduzir carga mental

- Captura rápida sempre acessível.
- Não exigir muitos campos para criar tarefa.
- Não misturar backlog com foco da semana de forma agressiva.
- Permitir tarefa da semana sem dia definido.
- Mostrar status da tarefa dentro da visão semanal.
- Mostrar dia planejado dentro do card do Kanban.
- Permitir replanejamento com drag and drop.
- Não tratar todo replanejamento como falha.
- Não mostrar tarefas concluídas antigas em destaque.

---

## 12. O que deixar fora por enquanto

Não implementar no MVP inicial:

```text
delegatedTo
followUpDate
blockedReason
definitionOfDone
projects
areas
tags
cockpit
métricas
revisão semanal
arquivamento
histórico detalhado
recorrência
subtarefas
comentários
anexos
```

Esses itens podem ser adicionados depois que o fluxo principal estiver funcionando bem.

---

## 13. Evolução natural depois do MVP

Depois do primeiro módulo funcionando, a evolução recomendada é adicionar, nesta ordem:

1. `area`
2. `project`
3. `nextAction`
4. `blocked`
5. `delegated`
6. `followUpDate`
7. visão “Hoje”
8. revisão semanal
9. métricas simples
10. arquivamento

---

## 14. Prompt simplificado para o coding agent

```text
Implemente o primeiro módulo de um Kanban semanal para TDAH usando Convex como backend.

O objetivo desta primeira versão é permitir planejamento simples de tarefas dentro da semana, com duas visões sincronizadas: Semana e Kanban.

A fonte da verdade deve ser única: cada tarefa existe uma única vez no banco Convex. A visão semanal e a visão Kanban apenas filtram e agrupam os mesmos registros.

A tarefa deve ter, no mínimo: title, description opcional, status, priority opcional, plannedWeek, plannedDay, sortOrder, createdAt, updatedAt e completedAt.

Os status iniciais são apenas: backlog, planned, doing e done.

A visão semanal deve ter as seguintes áreas:
- Backlog / não planejadas
- Esta semana — sem dia
- Segunda
- Terça
- Quarta
- Quinta
- Sexta
- Sábado
- Domingo
- Concluídas da semana

A visão Kanban deve ter as colunas:
- Backlog
- Planejadas
- Em andamento
- Concluídas
- Delegadas

Status e data são dimensões diferentes. Mover uma tarefa no Kanban altera o status. Mover uma tarefa na visão semanal altera plannedWeek e plannedDay.

Regras:
- Ao criar uma tarefa, ela entra como status backlog, sem plannedWeek e sem plannedDay.
- Ao mover uma tarefa para a semana, preencher plannedWeek com a semana atual e mudar status para planned.
- Ao mover uma tarefa para um dia, preencher plannedWeek e plannedDay.
- Ao mover uma tarefa para “Esta semana — sem dia”, limpar plannedDay, mas manter plannedWeek.
- Ao mover uma tarefa de volta para backlog, limpar plannedWeek e plannedDay e mudar status para backlog.
- Ao iniciar uma tarefa, mudar status para doing.
- Ao concluir uma tarefa, mudar status para done e preencher completedAt.
- As duas visões devem refletir imediatamente as alterações porque leem os mesmos dados do Convex.

A experiência deve ser simples, calma e com pouca fricção. O sistema não deve tentar resolver delegação, bloqueios, projetos, tags, cockpit ou métricas nesta primeira versão.
```

---

## 15. Critério de sucesso do MVP

O primeiro módulo estará bom se o usuário conseguir:

1. Criar uma tarefa rapidamente.
2. Ver tarefas não planejadas no backlog.
3. Promover uma tarefa para a semana.
4. Deixar uma tarefa na semana sem dia definido.
5. Alocar uma tarefa em um dia.
6. Mover uma tarefa entre dias.
7. Ver a mesma tarefa no Kanban.
8. Alterar o status no Kanban.
9. Ver a alteração refletida na visão semanal.
10. Concluir uma tarefa sem fricção.

O MVP falhou se:

- Kanban e Semana criarem tarefas duplicadas.
- O usuário precisar preencher campos demais para capturar uma tarefa.
- O backlog dominar visualmente a semana.
- Toda tarefa precisar obrigatoriamente de um dia.
- Replanejar parecer uma punição.
- A interface ficar bonita, mas não ajudar a decidir o próximo passo.
