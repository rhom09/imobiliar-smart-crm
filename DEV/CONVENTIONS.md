# Convenções

## Idioma

- UI, mensagens de erro, toasts e textos de WhatsApp em **pt-BR**.
- Código (variáveis, funções, tipos) em inglês; identificadores de domínio já existentes em português (`corretor`, `imobiliaria`, `equipe`, `imoveis`) ficam como estão.

## Onde colocar código novo

| O que | Onde |
| --- | --- |
| Nova tela | `src/routes/` (arquivo = rota). Dentro de `_authenticated/` se exigir login |
| Componente de domínio | `src/components/crm/` |
| Primitivo de UI | `src/components/ui/` via CLI do shadcn (`components.json`), não à mão |
| Regra de negócio / cálculo | `src/lib/crm/rules.ts` + teste em `rules.test.ts` |
| Tipos do domínio | `src/lib/crm/types.ts` |
| Acesso a dados / estado | `src/lib/crm/store.tsx` |
| Ação que exige privilégio | Server function (`*.functions.ts`) com `requireSupabaseAuth` |

## Regras

- **Nunca** reimplementar permissão ou Smart Match em componente. Importe de `rules.ts`.
- Mutação de dados: padrão otimista do store (atualiza estado, dispara Supabase, `fail()` em erro).
- Toda server function valida entrada (`inputValidator`) e re-checa o papel no servidor.
- Valores monetários: `brl()` / `brlCompact()`. Telefones: guardar só dígitos com DDI 55 (`normalizePhone`), exibir com `formatPhone`.
- Estilo: Tailwind v4, tokens do tema em `src/styles.css` (cores de etapa `bg-stage-*`). Evitar cores hardcoded.
- Utilitário de classes: `cn()` de `src/lib/utils.ts`.
- Mobile-first: o corretor usa na rua; teste layouts em tela pequena.
- Formatação: Prettier (`.prettierrc`); rode `lint` e `test` antes de concluir uma tarefa.

## Não fazer

- Não editar: `src/routeTree.gen.ts`, `src/integrations/**`, `src/components/ui/**`, `drizzle/schema.ts`.
- Não criar `src/pages/`, `app/layout.tsx` ou `_app` (convenções de Next/Remix não valem aqui).
- Não importar `client.server.ts` no topo de rota ou `*.functions.ts`.
- Não ativar cadastro público nem dar ao front poder de ampliar visibilidade de leads.
- Não persistir URLs de asset com hash do bundle; usar `asset:<chave>`.
- Não commitar segredos (`SUPABASE_SERVICE_ROLE_KEY` etc.).
- Se o projeto ainda sincroniza com o Lovable: não reescrever histórico git publicado.

## Testes

- Vitest + Testing Library (`src/test/setup.ts`, `src/test/app-routing.test.tsx`, `src/lib/crm/rules.test.ts`).
- Toda regra nova em `rules.ts` ganha teste.
