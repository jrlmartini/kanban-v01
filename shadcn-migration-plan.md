# Plano de migração incremental para shadcn/ui

## Objetivo

Migrar o dashboard para uma base de componentes no padrão shadcn/ui sem perder a identidade visual atual, sem quebrar os fluxos de Kanban/Semana/e-ink e sem transformar a interface em uma camada genérica.

## Estratégia

1. Criar uma camada local `src/components/ui` com primitives compatíveis com o padrão shadcn.
2. Migrar componentes base de baixo risco primeiro: `Button`, `Badge`, `Dialog`.
3. Manter cards, colunas, backlog rail, distribuição semanal e visão e-ink como componentes customizados.
4. Só introduzir Tailwind/Radix quando a base estiver estável e houver ganho real no componente migrado.
5. Migrar um componente por vez, sempre com `lint` e `build` passando.

## Ordem recomendada

1. `Button`, `Badge`, `Dialog` shell.
2. `Input`, `Textarea`, `Select`.
3. `Popover` e `Calendar` do seletor de semana.
4. `Tabs`/segmented controls.
5. Revisão final de tokens para aproximar de shadcn/Tailwind, se decidirmos instalar Tailwind.

## Critérios de sucesso

- A UI atual continua visualmente coerente.
- Nenhum fluxo perde funcionalidade: criar, editar, mover, concluir e arquivar tarefas.
- A visão e-ink permanece isolada e sem navegação.
- `npm run lint` passa.
- `npm run build` passa.
- Componentes migrados deixam de depender de classes soltas como `primary-action` quando houver primitive equivalente.
- Tokens seguem centralizados em `:root`, sem duplicar cores ou alturas mágicas.

## Fora de escopo por enquanto

- Reescrever cards do Kanban/Semana.
- Substituir o layout principal por componentes shadcn.
- Instalar Tailwind e Radix em massa.
- Refatorar Convex/local storage.
