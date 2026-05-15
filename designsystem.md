# FocusFlow Design System

## Propósito

Este design system traduz os tokens visuais extraídos de `kanban.png` em uma base prática para construir um kanban/planner moderno com shadcn/ui, Tailwind CSS e componentes reutilizáveis.

O objetivo não é copiar os elementos da imagem. O objetivo é capturar a linguagem visual: superfícies escuras em camadas, contraste calmo, acentos naturais, estados legíveis, densidade confortável e uma sensação premium sem excesso decorativo.

Use este documento para:
- criar telas consistentes de kanban, planner, foco, hábitos e produtividade
- configurar tokens globais em Tailwind e shadcn/ui
- orientar decisões de UI sem depender da imagem original
- evitar cores, sombras, espaçamentos e componentes improvisados
- manter uma experiência visual refinada, clara e tranquila

## Princípios de Design

- Clareza antes de decoração: cada cor, borda e estado deve ajudar a pessoa a entender o que fazer.
- Calma operacional: a interface deve reduzir ruído cognitivo e apoiar foco prolongado.
- Densidade respirável: muitas informações podem existir na tela, mas com espaçamento e hierarquia suficientes.
- Hierarquia por camadas: use superfície, borda, contraste e acento antes de recorrer a sombras fortes.
- Acentos com intenção: azul para ação/foco, verde para progresso/energia, âmbar para atenção/prioridade média, vermelho suave para urgência.
- Dark-first: a experiência principal é escura, sofisticada e confortável para uso diário.
- Componentes discretos: botões, cards, menus e inputs devem parecer úteis, não promocionais.
- Movimento gentil: microinterações devem confirmar intenção sem distrair.
- Acessibilidade é token: foco, contraste, tamanhos de toque e estados são parte do sistema.

## Direção Visual

A interface deve parecer:
- focada
- premium
- calma
- editorial
- organizada
- tátil
- confiável
- amigável para uso diário

A interface não deve parecer:
- neon
- gamer
- corporativa demais
- excessivamente arredondada
- cheia de gradientes
- dependente de glassmorphism
- como um dashboard genérico de SaaS

## Tokens de Cor

### Paleta Base Extraída

| Token | Hex | Uso |
|---|---:|---|
| `graphite` | `#0F1114` | Fundo principal, canvas global |
| `charcoal` | `#171A1F` | Superfície primária |
| `slate` | `#232831` | Superfície elevada, cards e colunas |
| `steel` | `#4C6B8A` | Ação primária, foco, seleção |
| `sage` | `#6B8F7A` | Sucesso, progresso, energia |
| `sand` | `#C8B58A` | Destaques suaves, metas e apoio visual |
| `amber` | `#D9A350` | Atenção, prioridade média, streak |
| `off-white` | `#E6E8EA` | Texto principal |

### Superfícies

| Token | Hex | Tailwind sugerido | Uso |
|---|---:|---|---|
| `background` | `#0F1114` | `bg-background` | Canvas da aplicação |
| `surface-1` | `#171A1F` | `bg-card` | Painéis, sidebar, popovers |
| `surface-2` | `#1F2329` | `bg-muted` | Cards, colunas, inputs |
| `surface-3` | `#262B33` | `bg-elevated` | Hover, menus, elementos ativos |
| `surface-4` | `#2E343D` | `bg-raised` | Estados selecionados discretos |
| `border` | `#2E343D` | `border-border` | Borda padrão |
| `divider` | `#2A313A` | `border-divider` | Separadores internos |

### Texto

| Token | Hex | Uso |
|---|---:|---|
| `text-primary` | `#E6E8EA` | Títulos, valores, labels importantes |
| `text-secondary` | `#B8C0C8` | Corpo, labels, navegação |
| `text-muted` | `#8F98A3` | Metadados, datas, placeholders |
| `text-subtle` | `#69727D` | Texto desabilitado e apoio raro |
| `text-inverse` | `#0F1114` | Texto sobre fills claros |

### Ações

| Token | Hex | Uso |
|---|---:|---|
| `primary` | `#4C6B8A` | Botão primário, seleção, foco |
| `primary-hover` | `#587A9B` | Hover do primário |
| `primary-active` | `#3F5B76` | Pressed/active do primário |
| `primary-soft` | `#223244` | Fundo sutil de seleção |
| `secondary` | `#2E343D` | Botão secundário, chips, controles |
| `secondary-hover` | `#38414C` | Hover de controles neutros |
| `ghost-hover` | `#222830` | Hover de botões fantasma |

### Estados Semânticos

| Token | Hex | Uso |
|---|---:|---|
| `success` | `#6B8F7A` | Baixa prioridade positiva, progresso, concluído |
| `success-soft` | `#1D2A23` | Fundo de estado positivo |
| `info` | `#4C6B8A` | Foco, hoje, informação neutra |
| `info-soft` | `#1D2835` | Fundo informativo |
| `warning` | `#D9A350` | Prioridade média, atenção, streak |
| `warning-soft` | `#342819` | Fundo de atenção |
| `danger` | `#C46A6A` | Alta prioridade, erro, urgência |
| `danger-soft` | `#351F22` | Fundo destrutivo discreto |
| `neutral` | `#A7AFB8` | Estado neutro, contadores e ícones |

### Prioridade de Tarefas

| Token | Cor | Uso |
|---|---:|---|
| `priority-high` | `#C46A6A` | Tarefa urgente/importante |
| `priority-medium` | `#D9A350` | Tarefa relevante, sem urgência máxima |
| `priority-low` | `#6B8F7A` | Tarefa leve, manutenção, rotina |

### Energia e Foco

| Token | Cor | Uso |
|---|---:|---|
| `energy-high` | `#8BBE91` | Alto foco, bom momento para trabalho profundo |
| `energy-medium` | `#7DA885` | Energia regular, tarefas moderadas |
| `energy-low` | `#5D7567` | Baixa energia, tarefas leves |
| `focus-ring` | `#6F8FB0` | Ring de foco acessível |
| `today` | `#4C6B8A` | Destaque do dia atual |

### Gráficos e Progresso

Use no máximo 5 cores simultâneas em visualizações. O sistema deve parecer editorial, não arco-íris.

| Token | Hex | Uso |
|---|---:|---|
| `chart-1` | `#4C6B8A` | Série primária |
| `chart-2` | `#6B8F7A` | Série positiva/progresso |
| `chart-3` | `#D9A350` | Meta, alerta, forecast |
| `chart-4` | `#C8B58A` | Série auxiliar |
| `chart-5` | `#C46A6A` | Série crítica/negativa |
| `chart-muted` | `#3A424C` | Histórico, trilho, baseline |

## Variáveis CSS para shadcn/ui

Use OKLCH no tema global quando possível. Mantenha os nomes compatíveis com shadcn/ui e adicione tokens próprios para camadas extras.

```css
:root {
  color-scheme: dark;

  --background: oklch(0.16 0.008 250);
  --foreground: oklch(0.93 0.004 250);

  --card: oklch(0.20 0.009 250);
  --card-foreground: oklch(0.93 0.004 250);

  --popover: oklch(0.20 0.009 250);
  --popover-foreground: oklch(0.93 0.004 250);

  --primary: oklch(0.50 0.055 250);
  --primary-foreground: oklch(0.96 0.004 250);

  --secondary: oklch(0.27 0.012 250);
  --secondary-foreground: oklch(0.82 0.006 250);

  --muted: oklch(0.24 0.010 250);
  --muted-foreground: oklch(0.68 0.008 250);

  --accent: oklch(0.58 0.060 145);
  --accent-foreground: oklch(0.96 0.004 250);

  --destructive: oklch(0.59 0.105 24);
  --destructive-foreground: oklch(0.96 0.004 250);

  --border: oklch(0.30 0.012 250);
  --input: oklch(0.26 0.012 250);
  --ring: oklch(0.63 0.060 250);

  --surface-1: #171A1F;
  --surface-2: #1F2329;
  --surface-3: #262B33;
  --surface-4: #2E343D;
  --divider: #2A313A;

  --success: #6B8F7A;
  --success-soft: #1D2A23;
  --info: #4C6B8A;
  --info-soft: #1D2835;
  --warning: #D9A350;
  --warning-soft: #342819;
  --danger: #C46A6A;
  --danger-soft: #351F22;

  --chart-1: #4C6B8A;
  --chart-2: #6B8F7A;
  --chart-3: #D9A350;
  --chart-4: #C8B58A;
  --chart-5: #C46A6A;

  --radius: 0.5rem;
}
```

## Tailwind Tokens

Configure tokens semânticos em vez de usar hex direto nos componentes.

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      background: "var(--background)",
      foreground: "var(--foreground)",
      card: "var(--card)",
      border: "var(--border)",
      input: "var(--input)",
      ring: "var(--ring)",
      surface: {
        1: "var(--surface-1)",
        2: "var(--surface-2)",
        3: "var(--surface-3)",
        4: "var(--surface-4)",
      },
      divider: "var(--divider)",
      success: "var(--success)",
      info: "var(--info)",
      warning: "var(--warning)",
      danger: "var(--danger)",
      chart: {
        1: "var(--chart-1)",
        2: "var(--chart-2)",
        3: "var(--chart-3)",
        4: "var(--chart-4)",
        5: "var(--chart-5)",
      },
    },
    borderRadius: {
      xs: "0.25rem",
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
    },
    boxShadow: {
      panel: "0 18px 50px rgb(0 0 0 / 0.28)",
      popover: "0 14px 32px rgb(0 0 0 / 0.34)",
      focus: "0 0 0 3px rgb(111 143 176 / 0.28)",
    },
  },
}
```

## Tipografia

### Família

Use uma fonte sem serifa moderna, legível e calma.

Opção recomendada:
- `Inter` para produto, kanban, forms e dashboards

Opções aceitáveis:
- `Geist Sans` para uma sensação mais atual e técnica
- `Outfit` se quiser uma aparência mais editorial

Evite fontes com personalidade excessiva. A interface precisa desaparecer durante o uso.

### Escala Tipográfica

| Token | Size | Line-height | Weight | Uso |
|---|---:|---:|---:|---|
| `display` | `32px` | `40px` | `700` | Hero, nome do produto em telas raras |
| `title-lg` | `24px` | `32px` | `650` | Título de página |
| `title-md` | `20px` | `28px` | `600` | Título de painel |
| `title-sm` | `16px` | `24px` | `600` | Cabeçalho de seção/card |
| `body-lg` | `15px` | `24px` | `400` | Texto explicativo |
| `body` | `14px` | `20px` | `400` | Texto padrão |
| `body-medium` | `14px` | `20px` | `500` | Labels e navegação ativa |
| `label` | `12px` | `16px` | `500` | Controles, chips, menus |
| `caption` | `11px` | `14px` | `500` | Datas, contadores, metadados |
| `overline` | `10px` | `12px` | `600` | Rótulos técnicos, badges pequenos |

### Regras de Tipografia

- Use `letter-spacing: 0` por padrão.
- Use `letter-spacing: 0.04em` apenas em overlines curtos e maiúsculos.
- Use `tabular-nums` em datas, contadores, timers e métricas.
- Não use texto gigante dentro de painéis compactos.
- O texto principal nunca deve ser branco puro. Use `text-primary`.
- Placeholders devem usar `text-muted`, nunca opacidade aleatória.

## Espaçamento

### Sistema Base

Use uma grade de 8px com ajustes de 4px para elementos densos.

| Token | Valor | Uso |
|---|---:|---|
| `space-0` | `0px` | Reset |
| `space-1` | `4px` | Microgap, ícone/texto |
| `space-2` | `8px` | Gap compacto |
| `space-3` | `12px` | Padding de controles |
| `space-4` | `16px` | Padding interno padrão |
| `space-5` | `20px` | Painéis densos |
| `space-6` | `24px` | Gaps entre blocos |
| `space-8` | `32px` | Padding de página |
| `space-10` | `40px` | Separação ampla |
| `space-12` | `48px` | Seções grandes |

### Layout

- Canvas desktop: `24px` a `32px` de padding.
- App shell com sidebar: sidebar fixa entre `240px` e `280px`.
- Gaps de colunas kanban: `12px` ou `16px`.
- Padding de coluna kanban: `8px` a `12px`.
- Padding de card de tarefa: `12px`.
- Gap entre cards de tarefa: `8px`.
- Header de página para conteúdo: `24px`.
- Painel lateral e popovers: `16px`.

### Responsivo

- Desktop amplo: máximo de conteúdo entre `1280px` e `1440px`.
- Laptop: manter colunas com scroll horizontal quando o kanban tiver muitos dias/status.
- Tablet: reduzir sidebar ou colapsar navegação.
- Mobile: transformar kanban em lista por dia/status, com troca por tabs ou segmented control.

## Radius, Bordas e Sombras

### Radius

| Token | Valor | Uso |
|---|---:|---|
| `radius-xs` | `4px` | Badges pequenos, indicadores |
| `radius-sm` | `6px` | Inputs, botões compactos |
| `radius-md` | `8px` | Cards de tarefa, menus |
| `radius-lg` | `12px` | Painéis e colunas |
| `radius-xl` | `16px` | Modais e containers especiais |

Regra: cards devem ficar em `8px` ou menos na maior parte da UI. Use `12px` apenas para painéis maiores.

### Bordas

| Token | Valor | Uso |
|---|---:|---|
| `border-subtle` | `1px solid rgb(46 52 61 / 0.56)` | Divisão leve |
| `border-default` | `1px solid #2E343D` | Cards e inputs |
| `border-strong` | `1px solid #4C6B8A` | Seleção, foco, hoje |
| `border-danger` | `1px solid #C46A6A` | Erros e alta prioridade |

### Sombras

| Token | Valor | Uso |
|---|---|---|
| `shadow-none` | `none` | Cards padrão |
| `shadow-soft` | `0 8px 24px rgb(0 0 0 / 0.22)` | Hover elevado discreto |
| `shadow-panel` | `0 18px 50px rgb(0 0 0 / 0.28)` | Modais e painéis laterais |
| `shadow-popover` | `0 14px 32px rgb(0 0 0 / 0.34)` | Menus, dropdowns, tooltips |
| `shadow-focus` | `0 0 0 3px rgb(111 143 176 / 0.28)` | Foco acessível |

Use bordas para estruturar. Use sombras apenas quando um elemento estiver realmente acima da camada atual.

## Ícones

### Biblioteca

Use `lucide-react`.

### Tamanhos

| Token | Valor | Uso |
|---|---:|---|
| `icon-xs` | `12px` | Badges e metadados |
| `icon-sm` | `14px` | Chips, labels, card footer |
| `icon-md` | `16px` | Botões e navegação |
| `icon-lg` | `20px` | Cabeçalhos e ações principais |
| `icon-xl` | `24px` | Empty states e destaques raros |

### Regras

- Stroke padrão: `1.75px`.
- Stroke compacto: `1.5px`.
- Ícones herdam a cor do texto por padrão.
- Ícones de estado usam tokens semânticos.
- Botões de ícone devem ter tooltip.
- Não desenhe SVG manual se houver ícone equivalente no Lucide.

## Componentes com shadcn/ui

### Base Recomendada

Use shadcn/ui para:
- `Button`
- `Input`
- `Textarea`
- `Select`
- `DropdownMenu`
- `Popover`
- `Dialog`
- `Sheet`
- `Tabs`
- `Tooltip`
- `Checkbox`
- `Switch`
- `Badge`
- `Progress`
- `ScrollArea`
- `Separator`
- `Command`
- `Calendar`

Adapte visualmente com tokens, sem criar bibliotecas paralelas de componentes.

### Botões

| Variante | Aparência | Uso |
|---|---|---|
| `primary` | fill `primary`, texto `primary-foreground` | Ação principal da tela ou painel |
| `secondary` | fill `surface-3`, borda `border` | Ações comuns |
| `ghost` | sem fill, hover `ghost-hover` | Ações de baixa ênfase |
| `outline` | transparente com borda | Filtros e ações secundárias |
| `danger` | fill ou outline `danger` | Ações destrutivas |

Alturas:
- Compacto: `32px`
- Padrão: `36px`
- Confortável: `40px`
- Touch/mobile: mínimo `44px`

### Inputs

Tokens:
- background: `surface-2`
- border: `border`
- placeholder: `text-muted`
- text: `text-primary`
- focus: `focus-ring` + `border-strong`
- disabled: `surface-1` + `text-subtle`

Regras:
- Inputs de captura rápida devem ser compactos e sempre claros.
- Campos com erro devem mostrar borda semântica e mensagem curta.
- Evite labels redundantes quando o contexto do painel já deixa o campo claro.

### Cards

#### Card de Tarefa

Tokens:
- background: `surface-2`
- hover background: `surface-3`
- border: `border-default`
- active border: `border-strong`
- radius: `radius-md`
- padding: `12px`
- shadow: `none`

Hierarquia interna:
- título: `body-medium`, `text-primary`
- prioridade: `caption`, cor semântica
- metadata: `caption`, `text-muted`
- tags: `label`, `surface-3`, `border-subtle`

Não prenda o design a um formato específico de card. Preserve apenas os tokens de camada, tipografia, prioridade, metadados e interação.

#### Card de Painel

Tokens:
- background: `surface-1`
- border: `border-default`
- radius: `radius-lg`
- padding: `16px` ou `24px`
- shadow: `none`

Use para laterais, progresso, foco, hábitos e resumos.

### Colunas Kanban

Tokens:
- background: `transparent` ou `surface-1`
- border: `border-subtle`
- active/today border: `primary`
- radius: `radius-lg`
- header text: `label`
- date text: `caption`
- counter: `surface-3` com `text-secondary`

Regras:
- A coluna ativa pode ter borda azul e leve superfície elevada.
- Não use fills fortes em colunas inteiras.
- Cards devem ser mais visíveis que a estrutura da coluna.
- Colunas vazias precisam manter altura e affordance para drop.

### Badges e Chips

Tokens:
- background: `surface-3`
- border: `border-subtle`
- text: `text-secondary`
- radius: `radius-xs`
- height: `20px` a `24px`
- padding: `6px` a `8px`

Estados:
- `today`: fundo `info-soft`, borda `info`, texto `text-primary`
- `high`: fundo `danger-soft`, texto `danger`
- `medium`: fundo `warning-soft`, texto `warning`
- `low`: fundo `success-soft`, texto `success`

### Menus e Popovers

Tokens:
- background: `surface-1`
- border: `border-default`
- shadow: `shadow-popover`
- radius: `radius-md`
- padding: `8px`

Itens:
- altura: `32px`
- radius: `radius-sm`
- hover: `surface-3`
- active: `primary-soft`

### Progressos e Indicadores

Progress bar:
- track: `surface-3`
- fill padrão: `success`
- fill foco/meta: `primary`
- fill atenção: `warning`
- height: `4px` a `8px`
- radius: pill

Dots:
- ativo: token semântico
- inativo: `surface-4`
- size: `6px`
- gap: `4px`

Counters:
- background: `surface-3`
- text: `text-secondary`
- radius: pill
- size mínimo: `20px`

## Estados de Interação

| Estado | Fórmula |
|---|---|
| Default | superfície base + borda sutil |
| Hover | aumentar uma camada de superfície ou borda em 8 a 12 por cento |
| Active | `primary-soft` + `border-strong` |
| Selected | borda `primary`, texto `text-primary`, ícone `primary` |
| Focus visible | ring `focus-ring`, sem remover outline acessível |
| Disabled | opacidade visual reduzida, texto `text-subtle`, cursor adequado |
| Dragging | sombra `shadow-soft`, borda `primary`, leve scale `1.01` |
| Drop target | fundo `info-soft`, borda tracejada `primary` |
| Loading | skeleton em `surface-3`, shimmer sutil |
| Error | `danger-soft`, borda/texto `danger` |

## Movimento

### Duração

| Token | Valor | Uso |
|---|---:|---|
| `motion-fast` | `120ms` | Hover, press, foco |
| `motion-base` | `180ms` | Menus, accordion, seleção |
| `motion-slow` | `260ms` | Sheets, dialogs, mudanças maiores |

### Easing

| Token | Valor | Uso |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Transições comuns |
| `ease-emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrada de painéis |
| `ease-linear` | `linear` | Timers e progresso contínuo |

### Regras

- Hover deve ser sutil.
- Drag and drop pode ter feedback um pouco mais expressivo.
- Timer e progresso não devem piscar.
- Respeite `prefers-reduced-motion`.

## Layout e Grid

### Shell

| Região | Token |
|---|---|
| Sidebar desktop | `260px` |
| Sidebar compacta | `72px` |
| Painel lateral | `320px` a `380px` |
| Header height | `56px` |
| Toolbar height | `44px` |
| Content max width | `1440px` |
| Page padding desktop | `24px` |
| Page padding amplo | `32px` |
| Page padding mobile | `16px` |

### Kanban

| Elemento | Token |
|---|---|
| Column min width | `180px` |
| Column ideal width | `220px` |
| Column max width | `260px` |
| Column gap | `12px` |
| Card gap | `8px` |
| Board min height | `560px` |
| Board padding | `12px` |

### Densidade

Crie três modos:
- `compact`: para power users e telas pequenas
- `comfortable`: padrão recomendado
- `spacious`: telas de planejamento e revisão

Tokens por modo:

| Modo | Card padding | Column gap | Font base |
|---|---:|---:|---:|
| `compact` | `8px` | `8px` | `13px` |
| `comfortable` | `12px` | `12px` | `14px` |
| `spacious` | `16px` | `16px` | `15px` |

## Acessibilidade

- Contraste mínimo para texto normal: 4.5:1.
- Contraste mínimo para texto grande: 3:1.
- Alvos clicáveis: mínimo `32px`, ideal `40px`, mobile `44px`.
- Todo botão de ícone precisa de `aria-label`.
- Todo menu deve operar por teclado.
- Estados de foco devem ser visíveis em todos os componentes.
- Não dependa apenas de cor para prioridade. Combine cor com texto, ícone ou posição.
- Timers devem ter rótulo textual acessível.
- Drag and drop deve ter alternativa por teclado ou menu de ação.

## Padrões de Conteúdo

### Tom

O texto da interface deve ser:
- curto
- humano
- específico
- calmo
- orientado à ação

### Labels

Use:
- `Add task`
- `Start focus`
- `View all`
- `Today`
- `High`
- `Med`
- `Low`
- `Done`

Evite:
- textos longos em botões
- instruções permanentes dentro da tela
- mensagens genéricas como `Something went wrong` sem ação possível

## Do e Don't

### Do

- Use tokens semânticos em todos os componentes.
- Use shadcn/ui como base e personalize por tema.
- Mantenha bordas e superfícies como principal estrutura visual.
- Use acentos com parcimônia.
- Faça estados de hover, foco, active e selected previsíveis.
- Use `tabular-nums` em timers, datas e contadores.
- Teste em desktop, laptop e mobile.

### Don't

- Não use hex direto em componentes.
- Não use branco puro ou preto puro.
- Não crie gradientes decorativos como base do sistema.
- Não coloque cards dentro de cards sem necessidade real.
- Não use sombras fortes em todos os painéis.
- Não transforme badges em botões se não forem interativos.
- Não copie a composição visual da imagem como componente obrigatório.

## Checklist de Implementação

1. Definir variáveis CSS globais em `globals.css`.
2. Mapear tokens no `tailwind.config.ts`.
3. Ajustar tema base do shadcn/ui para dark-first.
4. Criar variantes de `Button`, `Badge`, `Card`, `Input` e `Dropdown`.
5. Criar tokens semânticos para prioridade, energia, foco e progresso.
6. Remover hex hardcoded dos componentes.
7. Validar contraste e foco por teclado.
8. Validar responsividade do kanban em telas pequenas.
9. Criar exemplos internos usando tokens, não elementos fixos da imagem.

## Resumo dos Tokens Essenciais

```ts
export const focusFlowTokens = {
  colors: {
    background: "#0F1114",
    surface1: "#171A1F",
    surface2: "#1F2329",
    surface3: "#262B33",
    border: "#2E343D",
    divider: "#2A313A",
    textPrimary: "#E6E8EA",
    textSecondary: "#B8C0C8",
    textMuted: "#8F98A3",
    primary: "#4C6B8A",
    success: "#6B8F7A",
    warning: "#D9A350",
    danger: "#C46A6A",
    sand: "#C8B58A",
  },
  radius: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    6: "24px",
    8: "32px",
  },
  motion: {
    fast: "120ms",
    base: "180ms",
    slow: "260ms",
  },
}
```

