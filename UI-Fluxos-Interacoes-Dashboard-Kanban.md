---
type: ui-flow-spec
system: kanban-dashboard
page: pagina-principal
scope: ui-botoes-fluxos-interacoes
source: dashboard/app.js + dashboard/styles.css
created: 2026-05-13
status: reference
---

# UI e fluxos de interação — Dashboard / Kanban

Este documento descreve como a interface do nosso dashboard funciona na prática: o que existe na tela, quais botões aparecem, como o usuário interage, quais fluxos acontecem e quais decisões de UI fazem o painel parecer melhor que uma lista comum de tarefas.

A intenção é servir como referência para reconstruir a experiência em outro sistema.

---

# 1. Ideia principal da UI

O dashboard é uma tela de comando, não uma tela de cadastro.

A experiência deve passar esta sensação:

> “Abri a página e sei imediatamente o que exige minha atenção.”

A UI evita três erros comuns:

1. mostrar tarefa demais;
2. misturar backlog com execução;
3. transformar planejamento em formulário burocrático.

A tela principal combina três camadas:

1. **Cockpit** — o que exige atenção agora;
2. **Kanban/Semana** — onde o trabalho se movimenta;
3. **Backlog lateral** — onde ficam coisas soltas, atrasadas ou não planejadas.

---

# 2. Estado inicial da tela

Ao abrir a página, o usuário vê:

1. Header com título, data, hora, status de conexão e toggle e-ink;
2. Cockpit de execução;
3. Toolbar com controles de visualização e semana;
4. Sidebar de backlog à esquerda;
5. Kanban principal à direita.

Estado padrão:

```text
Visualização: Kanban
Escopo: Cockpit
Sidebar: aberta
Filtros: fechados
Modo: padrão escuro
```

Isto é importante: o sistema não abre em “todas as tarefas”. Abre no que é operacionalmente relevante.

---

# 3. Header

## Elementos

À esquerda:

```text
Digital Planner
Chief of Staff: Lynx
```

À direita:

```text
HH:MM
Dia da semana, DD de mês de AAAA
[e-ink toggle]
```

## Comportamento

- O relógio atualiza automaticamente a cada minuto.
- O toggle `e-ink` alterna entre o modo visual padrão e o modo e-ink.
- A escolha do modo fica salva no navegador.

## Decisão de UI

O header não tem menu complexo. Ele dá identidade e contexto temporal.

O usuário entende: “estou no meu planner operacional de hoje”.

---

# 4. Cockpit de execução

O cockpit é o primeiro bloco funcional depois do header.

## Título

```text
Cockpit de execução
```

## Subtexto

```text
Só entra aqui o que exige ação, decisão, prazo próximo, preparação ou acompanhamento.
```

## Indicadores à direita

```text
X relevantes
Y fora do painel
```

Isto é uma decisão de produto importante: o sistema mostra que há coisas fora da tela, mas não deixa elas ocuparem foco.

## Buckets exibidos

Quatro colunas/cards compactos:

1. **Hoje**
2. **Atrasadas**
3. **Delegadas**
4. **Próx. 14 dias**

Cada bucket tem:

- label pequeno em uppercase;
- contador;
- mini-cards clicáveis;
- estado vazio quando não há item.

## Mini-card do cockpit

Cada mini-card mostra:

- título;
- prioridade;
- status;
- data, se houver.

Clicar no mini-card abre o modal da atividade.

## Estados vazios

Quando não há itens:

```text
Nada marcado para hoje.
Sem atrasos.
Nada esperando terceiros.
Sem preparação próxima.
```

## Alerta visual

O bucket de atrasadas ganha tratamento de perigo quando há item atrasado.

---

# 5. Toolbar principal

A toolbar fica abaixo do cockpit.

Ela tem duas zonas:

1. controles de navegação e visualização à esquerda;
2. filtros e criação à direita.

---

# 6. Controle Semana/Kanban

À esquerda há um segmented control:

```text
[ Semana ] [ Kanban ]
```

## Comportamento

- Clicar em `Semana` troca a área principal para distribuição semanal.
- Clicar em `Kanban` volta para o fluxo por status.
- O botão ativo fica cyan com texto escuro.

## Decisão de UI

O controle é curto e óbvio. Não usa dropdown porque a troca de modo é uma ação frequente.

---

# 7. Navegação de semana

Depois do controle Semana/Kanban aparecem:

```text
[‹] [▦ 2026-W20] [›] [Hoje] 11 mai – 17 mai
```

## Botão `‹`

Vai para a semana anterior.

## Botão `›`

Vai para a próxima semana.

## Botão `Hoje`

Volta para a semana atual.

## Botão da semana

Mostra a semana ISO, por exemplo:

```text
2026-W20
```

Ao clicar, abre um popover de calendário.

---

# 8. Popover de calendário semanal

O popover abre abaixo do botão da semana.

## Elementos

Topo:

```text
[‹] maio de 2026 [›]
```

Grade:

- primeira coluna: número da semana;
- colunas seguintes: dias de segunda a domingo;
- semana selecionada destacada;
- dia atual marcado.

Rodapé:

```text
[Fechar] [Esta semana]
```

## Comportamento

- Clicar em uma semana/dia seleciona aquela semana.
- Clicar fora fecha o popover.
- `Fechar` fecha sem mudar.
- `Esta semana` volta para a semana atual.
- `Escape` também fecha.

---

# 9. Escopo do Kanban

Quando a visualização ativa é Kanban, aparece outro segmented control:

```text
[ Cockpit ] [ Esta semana ] [ Todas ]
```

## Cockpit

Modo padrão.

Mostra só atividades relevantes operacionalmente.

## Esta semana

Mostra a semana selecionada e mantém o backlog/atrasadas na sidebar para ajudar no planejamento sem misturar tarefas sem dia na grade.

## Todas

Mostra todas as atividades não arquivadas que passam pelos filtros.

## Decisão de UI

Este controle é essencial. Sem ele, o usuário alternaria entre excesso de foco e excesso de inventário.

---

# 10. Ações à direita da toolbar

À direita existem dois botões principais:

```text
[Buscar e filtrar] [Nova atividade]
```

## Buscar e filtrar

Botão secundário.

Abre/fecha o painel de filtros.

Se houver filtros ativos, o botão mostra contador:

```text
Buscar e filtrar · 2
```

## Nova atividade

Botão primário cyan.

Abre o modal de criação.

É a ação mais forte da toolbar.

---

# 11. Painel de filtros

O painel de filtros fica escondido por padrão.

Quando abre, aparece uma linha com:

1. input de busca;
2. filtro de tipo;
3. filtro de prioridade;
4. filtro de status;
5. botão limpar;
6. contador de resultados.

## Input de busca

Placeholder:

```text
Buscar por título, projeto, contexto ou próximo passo
```

A busca acontece enquanto digita.

## Select de tipo

```text
Todos os tipos
Profissional
Pessoal
```

## Select de prioridade

```text
Todas prioridades
P4 · Opcional
P3 · Normal
P2 · Importante
P1 · Crítica
```

## Select de status

```text
Todos status
Backlog
Não iniciada
Em andamento
Delegada
Concluída
```

## Botão Limpar

Reseta:

- busca;
- tipo;
- prioridade;
- status;
- fecha painel, se não houver filtro ativo.

## Contador

Formato:

```text
X de Y
```

Ajuda o usuário a entender quanto está filtrado.

---

# 12. Estrutura da área principal

Abaixo da toolbar, a tela se divide em:

```text
[Sidebar Backlog] [Main]
```

A sidebar fica à esquerda e o conteúdo principal à direita.

Esta divisão é um dos acertos da UI: backlog existe, mas não compete com execução.

---

# 13. Sidebar de backlog

## Cabeçalho

```text
Backlog [contador] [‹]
```

O botão `‹` recolhe a sidebar.

## Abas

```text
Todos [n]
Atrasadas [n]
Backlog [n]
```

## Aba Todos

Mostra duas seções quando aplicável:

```text
Atrasadas
Sem data / backlog
```

## Aba Atrasadas

Mostra apenas atividades atrasadas de semanas anteriores, que precisam ser reprogramadas.

## Aba Backlog

Mostra atividades sem data/backlog, excluindo atrasadas.

## Card na sidebar

É uma versão compacta do card principal.

Mostra:

- tipo;
- `Atrasada` ou data;
- título;
- prioridade;
- status.

Clicar abre modal.

## Sidebar colapsada

Quando recolhida, vira uma rail estreita com:

- botão `›`;
- contador circular;
- texto vertical `Backlog`.

Clicar nela reabre.

---

# 14. Main em modo Kanban

Quando `Kanban` está ativo, o main mostra:

```text
Fluxo de trabalho
```

Depois uma grade com cinco colunas:

```text
Backlog | Não iniciada | Em andamento | Delegada | Concluída
```

## Cabeçalho de cada coluna

Cada coluna tem:

- dot colorido;
- nome;
- contador;
- linha divisória.

## Corpo da coluna

- Cards empilhados verticalmente.
- Área aceita drag and drop.
- Se vazia, mostra:

```text
Solte atividades aqui.
```

## Fluxo de drag and drop no Kanban

1. Usuário arrasta card.
2. Card fica semitransparente.
3. Coluna de destino ganha outline tracejado.
4. Ao soltar, status muda para a coluna de destino.
5. Interface recarrega.

Exemplos:

- Soltar em `Em andamento` → status `doing`.
- Soltar em `Delegada` → status `delegated`.
- Soltar em `Concluída` → status `done`, preenche conclusão e mantém a atividade visível na coluna/semana com tratamento discreto.

---

# 15. Main em modo Semana

Quando `Semana` está ativo, o main mostra:

```text
Distribuição semanal
```

Depois uma grade com seis colunas:

```text
Segunda | Terça | Quarta | Quinta | Sexta | Fim de semana
```

## Cabeçalho de cada dia

Mostra:

- nome do dia;
- contador.

## Corpo de cada dia

Dentro do dia, as tarefas aparecem agrupadas por status.

Exemplo:

```text
Em andamento [2]
- Card
- Card

Não iniciada [1]
- Card
```

## Fluxo de drag and drop na Semana

1. Usuário arrasta uma atividade para um dia.
2. Sistema define a semana selecionada.
3. Sistema define o dia operacional.
4. Para segunda a sexta, calcula a data exata.
5. Se a atividade estava em backlog, vira `Não iniciada`.

Resultado funcional:

> Planejar uma tarefa é arrastá-la para o dia certo.

---

# 16. Card de atividade

O card precisa ser denso, mas escaneável.

## Estrutura visual

### Linha superior

À esquerda:

```text
● Profissional
```

ou

```text
● Pessoal
```

À direita, se houver:

```text
Atrasada
```

ou uma data:

```text
2026-05-13
```

### Título

Título grande, em Sora, máximo duas linhas.

### Linha inferior

À esquerda:

```text
● P2 · Importante
```

À direita, quando necessário:

```text
EM ANDAMENTO
```

## Estados visuais

### Hover

- borda fica cyan;
- card sobe 1px;
- glow discreto.

### Dragging

- opacidade cai;
- cursor vira grabbing.

### Crítica

Atividade `P1 · Crítica` ganha borda esquerda vermelha.

## Interações

- Clicar abre modal.
- Arrastar muda status ou planejamento, dependendo do destino.

---

# 17. Modal de criação/edição

O modal é o centro dos fluxos de criação e edição.

## Abertura

Abre por:

- botão `Nova atividade`;
- clique em card;
- clique em mini-card do cockpit;
- clique em card da sidebar.

## Overlay

- Fundo escuro translúcido.
- Blur leve.
- Modal centralizado.

## Título do modal

Se nova:

```text
Nova atividade
```

Se existente:

```text
Editar atividade
```

## Botão fechar

No canto superior direito:

```text
×
```

Também fecha com:

- clique fora do modal;
- tecla `Escape`.

---

# 18. Campos do modal

## Título

Input simples.

Placeholder:

```text
Ex.: Revisar proposta
```

É obrigatório para salvar.

## Tipo

Toggle pills:

```text
Profissional
Pessoal
```

## Status

Toggle pills:

```text
Backlog
Não iniciada
Em andamento
Delegada
Concluída
```

## Prioridade

Toggle pills:

```text
P4 · Opcional
P3 · Normal
P2 · Importante
P1 · Crítica
```

## Data

Botão de calendário.

Se sem data:

```text
Sem data · backlog
```

Se com data:

```text
2026-05-13
```

## Próximo passo

Textarea.

Este campo é importante porque transforma tarefa vaga em ação executável.

---

# 19. Calendário dentro do modal

Ao clicar no botão de data, abre um calendário menor.

## Elementos

Topo:

```text
[‹] maio de 2026 [›]
```

Grade:

- dias do mês;
- dias de fora do mês aparecem apagados;
- hoje tem marca;
- data selecionada fica destacada.

Rodapé:

```text
[Sem data] [Hoje]
```

## Botão Sem data

Limpa data, semana e dia.

A atividade volta para backlog.

## Botão Hoje

Define a data de hoje.

Se a atividade estava em backlog, vira `Não iniciada`.

## Selecionar qualquer data

Define:

- data;
- semana ISO;
- dia operacional.

Se estava em backlog, vira `Não iniciada`.

---

# 20. Ações do modal

## Nova atividade

Mostra:

```text
[Cancelar] [Criar]
```

### Cancelar

Fecha sem salvar.

### Criar

Cria atividade se houver título.

Se não houver título, não faz nada.

## Atividade existente

Mostra:

À esquerda:

```text
[Concluir] [Arquivar]
```

À direita:

```text
[Cancelar] [Salvar]
```

### Concluir

Marca como concluída e mantém a atividade no contexto planejado com visual mais discreto.

### Arquivar

Pede confirmação antes.

Mensagem:

```text
Arquivar esta atividade? Ela sai do dashboard ativo, mas continua preservada no Obsidian.
```

Se confirmar, move para Archived.

### Cancelar

Fecha sem salvar mudanças do modal.

### Salvar

Atualiza atividade existente.

---

# 21. Fluxo: criar uma atividade solta

1. Usuário clica `Nova atividade`.
2. Modal abre em branco.
3. Usuário escreve título.
4. Opcionalmente define prioridade e próximo passo.
5. Não escolhe data.
6. Clica `Criar`.
7. Atividade nasce como `Backlog`.
8. Ela aparece na sidebar e/ou coluna Backlog, dependendo do escopo.

Este fluxo serve para captura rápida.

Não exige planejamento na hora.

---

# 22. Fluxo: criar uma atividade planejada

1. Usuário clica `Nova atividade`.
2. Escreve título.
3. Escolhe data no calendário.
4. Sistema calcula semana/dia.
5. Se estava em backlog, muda para `Não iniciada`.
6. Usuário clica `Criar`.
7. Atividade aparece na semana e nos filtros relevantes do Kanban.

Este fluxo transforma ideia em compromisso operacional.

---

# 23. Fluxo: editar atividade

1. Usuário clica em um card.
2. Modal abre preenchido.
3. Usuário ajusta título, tipo, status, prioridade, data ou próximo passo.
4. Clica `Salvar`.
5. Card muda de posição, se status/data mudarem.
6. Markdown no Obsidian é atualizado.

---

# 24. Fluxo: planejar pelo arrastar/soltar

1. Usuário vê atividade no backlog/sidebar.
2. Troca para visualização `Semana`.
3. Arrasta atividade para um dia.
4. Atividade recebe semana/dia/data.
5. Se era backlog, vira `Não iniciada`.
6. Passa a fazer parte da agenda operacional.

Este é um dos fluxos mais importantes da UI.

Ele reduz fricção: planejar não exige abrir formulário.

---

# 25. Fluxo: mudar status pelo Kanban

1. Usuário arrasta card para outra coluna.
2. Sistema altera o status.
3. Card reaparece na coluna nova.
4. Se foi para `Concluída`, recebe status `done`, preenche conclusão e continua rastreável no contexto planejado.

Este fluxo é o equivalente visual de “mover trabalho”.

---

# 26. Fluxo: lidar com atrasadas

Atividades atrasadas aparecem no cockpit sempre que a data planejada ficou antes de hoje.

Quando a atividade atrasada ainda pertence a semana em andamento, ela permanece no dia planejado e no Kanban, conforme o status dela.

Atividades atrasadas de semanas anteriores aparecem em dois lugares operacionais:

1. bucket `Atrasadas` no cockpit;
2. sidebar, aba `Atrasadas`, como fila de reprogramação.

Isso cria redundância intencional sem deixar tarefa vencida solta no Kanban ativo.

Ao tentar levar uma atrasada de semana anterior para o Kanban, o sistema deve abrir planejamento para escolher uma nova data.

---

# 27. Fluxo: delegadas

Atividades com status `Delegada` aparecem:

1. na coluna `Delegada`;
2. no bucket `Delegadas` do cockpit;
3. nos filtros/status.

Função: lembrar que existe acompanhamento com terceiros.

Não é tarefa para executar imediatamente, mas é tarefa para vigiar.

---

# 28. Fluxo: concluir

Há duas formas naturais:

1. arrastar para coluna `Concluída`;
2. abrir modal e clicar `Concluir`.

Em ambos os casos, a atividade:

- recebe status concluído;
- ganha data de conclusão;
- permanece rastreável na semana/kanban com visual mais discreto;
- deixa de aparecer como pendente.

---

# 29. Fluxo: arquivar

Arquivar é diferente de concluir.

Serve para tirar do painel algo que não deve mais competir por atenção, sem apagar histórico.

Fluxo:

1. abre card;
2. clica `Arquivar`;
3. confirma;
4. atividade sai do dashboard ativo;
5. arquivo vai para Archived.

---

# 30. Fluxo: filtrar para encontrar algo

1. Usuário clica `Buscar e filtrar`.
2. Digita termo ou escolhe filtros.
3. Contador mostra quantos itens restaram.
4. Usuário abre ou move a atividade.
5. Pode clicar `Limpar` para voltar ao estado normal.

O filtro não é a experiência principal. É uma ferramenta de recuperação.

---

# 31. Pequenos comportamentos que melhoram a experiência

## Clique fora fecha popover

Calendários não ficam presos na tela.

## Escape fecha modal/popover

Atalho natural para sair.

## Hover nos botões

Botões secundários elevam levemente ou mudam borda.

## Hover nos cards

O card responde com borda cyan e leve elevação.

## Estados vazios têm texto

Colunas vazias dizem:

```text
Solte atividades aqui.
```

Isso ensina o comportamento da UI sem tutorial.

## Sidebar sticky

Backlog continua visível enquanto o usuário trabalha no painel.

---

# 32. O que não fazer ao recriar

Evitar:

1. abrir em “Todas” por padrão;
2. transformar criação em formulário longo;
3. esconder backlog em uma página separada;
4. misturar atrasadas com tarefas comuns sem destaque;
5. remover o cockpit;
6. usar cor como decoração em vez de função;
7. fazer drag/drop só visual sem persistir no arquivo;
8. exigir data para toda captura;
9. apagar tarefas concluídas/arquivadas;
10. deixar próximo passo escondido demais.

---

# 33. Checklist para o amigo coder

Para chegar perto do nosso, precisa ter:

- [ ] Header com identidade, data e hora.
- [ ] Cockpit com Hoje, Atrasadas, Delegadas e Próx. 14 dias.
- [ ] Contador de relevantes vs fora do painel.
- [ ] Toggle Semana/Kanban.
- [ ] Navegação de semana com calendário popover.
- [ ] Escopo do Kanban: Cockpit / Esta semana / Todas.
- [ ] Botão Buscar e filtrar com contador de filtros ativos.
- [ ] Botão Nova atividade forte e claro.
- [ ] Sidebar de backlog persistente e colapsável.
- [ ] Kanban com cinco colunas.
- [ ] Semana com seis colunas, incluindo fim de semana.
- [ ] Cards clicáveis e arrastáveis.
- [ ] Modal curto para criar/editar.
- [ ] Campo Próximo passo.
- [ ] Calendário no modal com Sem data e Hoje.
- [ ] Concluir mantendo contexto planejado e aplicando visual discreto.
- [ ] Arquivar movendo para Archived.
- [ ] Atualização real da fonte de dados.

---

# 34. A essência da experiência

O dashboard parece bom porque a UI segue uma lógica operacional forte:

```text
Capturar rápido → separar backlog → destacar o que importa → planejar por semana → executar por status → preservar histórico.
```

Se a nova versão copiar só as cores, não vai ficar boa.

Ela precisa copiar a hierarquia:

1. cockpit primeiro;
2. backlog lateral;
3. Kanban filtrado por relevância;
4. criação rápida;
5. drag/drop que muda estado real;
6. próximo passo como unidade mínima de execução.
