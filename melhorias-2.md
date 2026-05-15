1. Problema: tamanho dos cards
Situação atual

Com as últimas adições de informações e botões nos cards, eles ficaram visualmente apertados.

Os cards estão verticalmente pequenos para acomodar:

título da tarefa;
descrição ou metadados;
badges de status/prioridade;
informações de data;
botões ou ações rápidas;
possíveis indicadores visuais.

Isso prejudica a leitura, aumenta o ruído visual e passa sensação de interface “espremida”.

Solução esperada

Padronizar o tamanho dos cards para que todos os elementos caibam com respiro visual adequado.

A correção deve garantir que:

os cards tenham altura mínima suficiente;
os elementos internos não fiquem sobrepostos ou apertados;
os botões tenham espaço clicável confortável;
o layout funcione tanto no Kanban quanto na visão semanal;
cards com menos conteúdo não fiquem estranhos;
cards com mais conteúdo não quebrem visualmente a interface.

A prioridade é manter uma interface limpa, calma e legível.

Não queremos cards exageradamente grandes, mas também não queremos cards comprimidos.

O objetivo é encontrar um padrão visual consistente e confortável.

Critério de aceite

A correção estará adequada quando:

todos os cards tiverem espaço suficiente para título, informações auxiliares e ações;
nenhum botão ou badge parecer “espremido”;
a leitura do card estiver confortável;
o mesmo card funcionar bem nas colunas do Kanban e nos dias da visão semanal;
a interface continuar elegante, minimalista e sem excesso visual.

2. Problema: navegação de datas e tarefas “atrasadas”
Situação atual

Ao navegar para semanas futuras no calendário, tarefas de semanas anteriores à semana visualizada aparecem como “atrasadas”.

Isso está conceitualmente errado.

Uma tarefa não deve ser considerada atrasada em relação à semana que o usuário está navegando.

Atraso deve ser uma característica calculada em relação à data real de hoje.

Exemplo do problema

Imagine que hoje é 14 de maio.

Se o usuário navegar para a semana de 25 de maio, uma tarefa planejada para 20 de maio não deve aparecer como atrasada apenas porque está antes da semana visualizada.

Ela só deve ser considerada atrasada se sua data planejada for anterior ao dia real de hoje e ela ainda não estiver concluída.

Ou seja:

Atraso não depende da semana aberta na interface.

Depende apenas de:

data planejada da tarefa;
data real de hoje;
status da tarefa.
Solução esperada

A lógica de “atrasado” deve ser calculada exclusivamente com base na data atual real do sistema.

Uma tarefa deve ser considerada atrasada somente se:

tiver uma data planejada;
essa data planejada for anterior à data real de hoje;
a tarefa não estiver concluída.

Se o usuário estiver navegando por semanas futuras ou passadas, isso não deve alterar a definição de atraso.

A navegação no calendário serve apenas para mudar o período visualizado.

Ela não deve alterar a lógica de status temporal da tarefa.

Modelo mental correto

Existem duas datas diferentes no sistema:

1. Data de hoje

É a data real atual.

Serve para calcular:

atraso;
tarefas de hoje;
indicadores temporais reais.

2. Data ou semana visualizada

É apenas o período que o usuário está olhando na interface.

Serve para:

filtrar tarefas mostradas na semana;
navegar entre semanas;
organizar a visualização.

A semana visualizada não deve ser usada para decidir se algo está atrasado.

Regra correta para atraso
A regra de produto deve ser:

Uma tarefa está atrasada quando deveria ter sido feita antes de hoje e ainda não foi concluída.

Não importa se o usuário está visualizando:

a semana atual;
uma semana passada;
uma semana futura.

O conceito de atraso continua sendo relativo ao dia real de hoje.

Critério de aceite

A correção estará adequada quando:

navegar para semanas futuras não fizer tarefas anteriores à semana visualizada aparecerem automaticamente como atrasadas;
navegar para semanas passadas não alterar artificialmente a lógica de atraso;
somente tarefas com data anterior à data real de hoje e ainda não concluídas sejam marcadas como atrasadas;
tarefas concluídas nunca sejam marcadas como atrasadas;
a data/semana visualizada seja usada apenas para navegação e filtro visual, não para cálculo de atraso.
Diretriz geral

Preserve a lógica de produto já definida anteriormente:

Backlog é tudo que ainda não entrou no calendário. Kanban é o fluxo do que já entrou na semana.

Estas duas correções devem apenas melhorar a experiência visual e corrigir a interpretação temporal.

Não introduzir novos buckets, novos status ou novas regras conceituais desnecessárias.