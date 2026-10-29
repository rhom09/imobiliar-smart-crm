# Design System

Extraído de `src/styles.css`, `src/routes/__root.tsx`, `src/components/ui/button.tsx` e dos componentes `AppShell`, `KanbanBoard` e `LeadCard`. Em caso de divergência, **o código vale mais que este documento**.

## Identidade

- Marca exibida na UI: **Morada** (logo "m" + "morada", subtítulo "CRM imobiliário"). O nome do projeto/repositório é "Imobiliar Smart CRM".
- Conceito (comentário do próprio `styles.css`): _superfícies de papel quentes, verde-floresta profundo como cor primária, terracota como acento_.
- Tom visual: caloroso, profissional, mobile-first (o corretor usa na rua). Textos em pt-BR.
- `theme-color` do navegador: `#1f3b32`.

## Como mexer nos tokens

- Todas as cores usam **oklch** e vivem em `:root` (claro) e `.dark` (escuro) em `src/styles.css`.
- Token novo = declarar a variável em `:root` e `.dark` **e** registrar em `@theme inline` (`--color-<nome>: var(--<nome>)`). Só assim vira classe Tailwind (`bg-<nome>`, `text-<nome>`).
- Dark mode: variante `dark` baseada na classe `.dark` (`@custom-variant dark`). Os tokens escuros existem; não verifiquei se há alternador de tema na interface.
- **Nunca** usar cores hardcoded (hex/rgb) em componentes; usar tokens.

## Cores

### Base (claro → escuro)

| Token                | Claro                    | Escuro                   | Uso                                         |
| -------------------- | ------------------------ | ------------------------ | ------------------------------------------- |
| `background`         | `oklch(0.982 0.007 85)`  | `oklch(0.19 0.02 165)`   | Fundo da página (papel quente)              |
| `foreground`         | `oklch(0.23 0.03 165)`   | `oklch(0.95 0.01 100)`   | Texto principal                             |
| `card` / `popover`   | `oklch(0.997 0.003 85)`  | `oklch(0.23 0.025 165)`  | Cards, menus, diálogos                      |
| `primary`            | `oklch(0.4 0.08 162)`    | `oklch(0.75 0.11 160)`   | Verde-floresta: ação principal, links, foco |
| `primary-foreground` | `oklch(0.985 0.01 120)`  | `oklch(0.2 0.03 165)`    | Texto sobre primary                         |
| `secondary`          | `oklch(0.948 0.014 120)` | `oklch(0.29 0.03 165)`   | Chips neutros, item ativo na nav mobile     |
| `muted`              | `oklch(0.955 0.01 85)`   | `oklch(0.27 0.02 165)`   | Fundos sutis, skeleton                      |
| `muted-foreground`   | `oklch(0.5 0.02 160)`    | `oklch(0.72 0.02 140)`   | Texto secundário                            |
| `accent`             | `oklch(0.93 0.04 55)`    | `oklch(0.35 0.06 45)`    | Terracota suave: hover, alerta leve         |
| `accent-foreground`  | `oklch(0.38 0.1 40)`     | `oklch(0.93 0.04 55)`    | Texto sobre accent                          |
| `destructive`        | `oklch(0.58 0.2 27)`     | `oklch(0.68 0.19 25)`    | Erros, atraso                               |
| `border`             | `oklch(0.905 0.012 90)`  | `oklch(1 0 0 / 10%)`     | Bordas (aplicado a `*` por padrão)          |
| `input`              | `oklch(0.895 0.014 90)`  | `oklch(1 0 0 / 14%)`     | Borda de campos                             |
| `ring`               | `oklch(0.55 0.09 162)`   | `oklch(0.65 0.1 160)`    | Foco                                        |
| `column`             | `oklch(0.958 0.01 90)`   | `oklch(0.215 0.022 165)` | Fundo das colunas do Kanban                 |

### Sidebar (verde escuro nos dois temas)

`sidebar` `oklch(0.27 0.045 165)` · `sidebar-foreground` `oklch(0.93 0.015 120)` · `sidebar-primary` (dourado) `oklch(0.8 0.13 75)` · `sidebar-accent` `oklch(0.33 0.05 165)` · `sidebar-border` `oklch(0.36 0.04 165)`.

### Semânticas do domínio

| Token                                | Valor                                           | Uso                                     |
| ------------------------------------ | ----------------------------------------------- | --------------------------------------- |
| `whatsapp` / `whatsapp-foreground`   | `oklch(0.62 0.16 152)` / `oklch(0.99 0.01 150)` | Botão de WhatsApp (variante `whatsapp`) |
| `highlight` / `highlight-foreground` | `oklch(0.8 0.13 75)` / `oklch(0.26 0.05 60)`    | Destaque dourado (variante `highlight`) |

### Etapas do funil

Classes `bg-stage-*` ligadas em `STAGES` (`src/lib/crm/rules.ts`):

| Etapa            | Token            | Valor                             |
| ---------------- | ---------------- | --------------------------------- |
| Novo Lead        | `stage-new`      | `oklch(0.62 0.1 230)` (azul)      |
| Contato Feito    | `stage-contact`  | `oklch(0.7 0.13 75)` (dourado)    |
| Visita Agendada  | `stage-visit`    | `oklch(0.6 0.12 300)` (roxo)      |
| Proposta Enviada | `stage-proposal` | `oklch(0.66 0.15 45)` (terracota) |
| Fechado (Ganho)  | `stage-won`      | `oklch(0.55 0.12 155)` (verde)    |
| Perdido          | `stage-lost`     | `oklch(0.58 0.03 260)` (cinza)    |

Etapa nova = novo token + entrada em `STAGES` + enum no banco (ver `DATABASE.md`).

### Gráficos

`chart-1` a `chart-5` (verde, terracota, dourado, azul, magenta). Usar para o dashboard do roadmap.

## Tipografia

- **Texto:** Figtree (400, 500, 600, 700) via Google Fonts → `font-sans`.
- **Títulos:** Bricolage Grotesque (500, 600, 700) → `font-display`. Já aplicado automaticamente a `h1`, `h2`, `h3`, com `letter-spacing: -0.02em`.
- Corpo com `-webkit-font-smoothing: antialiased`.
- Padrões vistos: título de página `text-2xl font-bold md:text-3xl`; nome em card `font-semibold leading-tight`; texto secundário `text-[13px] text-muted-foreground`; microtexto/chips `text-[11px]`–`text-xs font-semibold`.
- As fontes vêm de CDN do Google; os `<link>` ficam em `src/routes/__root.tsx`.

## Forma, sombra e espaçamento

- **Raio base:** `--radius: 0.875rem`; escala `sm` (−4px) até `4xl` (+16px).
- Padrão por tipo: cards de lead `rounded-2xl`; colunas do Kanban `rounded-3xl`; itens de nav `rounded-xl`; chips e botões de ação rápida `rounded-full`.
- **Sombras:** `shadow-card` (repouso, bem suave) e `shadow-lift` (card arrastado/destaque). Ambas são utilities customizadas.
- Utility extra: `scrollbar-none` (esconde scrollbar em carrosséis).
- Margens de página: `px-4` no mobile, `md:px-8` no desktop.

## Componentes base (shadcn/ui, `src/components/ui/`)

Gerados pelo shadcn; não editar à mão (exceto o que o projeto já customizou). Ícones: **lucide-react**, tamanho padrão `size-4` (nav: `size-[18px]`/`size-5`).

### Button (`cva`)

- Variantes: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, **`whatsapp`**, **`highlight`** (as duas últimas são do projeto).
- Tamanhos: `default` (h-9), `sm` (h-8, `text-xs`), `lg` (h-10), `icon` (h-9 w-9).
- Foco por `ring` de 1px. Use `asChild` para renderizar `<a>`/`<Link>` com estilo de botão.
- Ação de WhatsApp: `variant="whatsapp"` + ícone `WhatsAppIcon`.

### Toasts

`sonner`, posição `top-center` (definido em `__root.tsx`). Mensagens curtas em pt-BR (ex.: "Maria → Visita Agendada").

## Padrões de layout

- **Desktop (`md+`):** sidebar fixa `w-64` (verde escuro, logo invertido, nav com item ativo `bg-sidebar-accent` e ícone dourado); conteúdo com `md:pl-64`.
- **Mobile:** header sticky com blur (`bg-background/90 backdrop-blur`) e **bottom nav** de 3 itens com `pb-[env(safe-area-inset-bottom)]`; conteúdo com `pb-24`. Item ativo: ícone em pílula `bg-secondary`, texto `text-primary`.
- Navegação atual: Funil `/`, Imóveis `/imoveis`, Imobiliária `/imobiliaria`. (`/equipe` existe como rota mas não aparece nessa nav.)
- `PageHeader({ title, subtitle, actions })` e `LoadingBlock()` (3 blocos `animate-pulse rounded-2xl bg-muted`) estão em `AppShell.tsx`; reutilizar.
- Admin vê o `RoleSwitcher` na sidebar (desktop) ou compacto no header (mobile).

## Padrões de componente

**Card de lead** (`LeadCard`): `rounded-2xl border bg-card p-3.5 shadow-card`; hover sobe `-translate-y-0.5` com borda `primary/25`; arrastando: `rotate-[1.5deg] shadow-lift ring-2 ring-primary/30`. Faixa de orçamento em chip `bg-muted`; localização com ícone `MapPin`; avatar de dono em círculo `bg-primary/10 text-primary` (só para admin).

**Chip de urgência de contato** (`contactUrgency`):

| Nível  | Quando          | Classes                                  |
| ------ | --------------- | ---------------------------------------- |
| `ok`   | menos de 3 dias | `bg-secondary text-secondary-foreground` |
| `warn` | 3 a 6 dias      | `bg-accent text-accent-foreground`       |
| `late` | 7 dias ou mais  | `bg-destructive/12 text-destructive`     |

**Coluna do Kanban:** `rounded-3xl bg-column p-2.5`; largura `w-[84vw] max-w-[320px]` no mobile e `sm:w-[300px]`; carrossel com `snap-x snap-mandatory` no mobile; cabeçalho com bolinha da cor da etapa, título `font-display text-sm font-semibold`, contador em pílula `bg-card` e soma de orçamento `brlCompact`. Ao arrastar por cima: `bg-secondary ring-2 ring-primary/30`.

**Estado vazio:** caixa `border-2 border-dashed`, `rounded-2xl`, texto `text-xs text-muted-foreground` (ex.: "Arraste um lead para cá").

**Drag-and-drop:** sensores Mouse (distância 6px), Touch (delay 220ms, tolerância 8px) e Teclado; `DragOverlay` com animação de 180ms. Manter esses valores ao criar novas áreas arrastáveis (evita conflito com scroll no mobile).

**Datas:** `date-fns` com locale `ptBR` (ex.: `formatDistanceToNowStrict`). **Moeda:** `brl()` / `brlCompact()` de `rules.ts`.

## Regras

1. Usar tokens semânticos (`bg-card`, `text-muted-foreground`, `bg-stage-*`); nunca hex.
2. Reutilizar `Button` e seus variantes; não criar botões do zero.
3. Mobile primeiro: testar em tela estreita, alvos de toque confortáveis (mínimo ~32–36px), respeitar `safe-area-inset`.
4. Títulos com `font-display` (já automático em `h1`–`h3`).
5. Todo estado novo de UI precisa de variante clara e escura (`:root` e `.dark`).
6. Textos de interface em pt-BR.
7. Acessibilidade: `aria-label` em botões só com ícone; foco visível via `ring`.

## Não fazer

- Não editar `src/components/ui/**` à mão nem trocar a paleta fora de `styles.css`.
- Não introduzir outra biblioteca de ícones, fontes ou de componentes.
- Não usar sombras ou raios soltos; usar `shadow-card`/`shadow-lift` e a escala de `--radius`.
- Não criar tokens sem registrá-los em `@theme inline` (a classe Tailwind não existirá).
