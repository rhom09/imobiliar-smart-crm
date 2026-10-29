# Arquitetura

## Visão geral

App **TanStack Start** (React 19 + Vite) com backend no **Lovable Cloud** (Supabase gerenciado). A área logada roda **somente no cliente** e conversa direto com o Supabase; o servidor entra apenas em server functions que precisam de privilégio de admin.

## Rotas (`src/routes/`)

Roteamento por arquivo. `src/routeTree.gen.ts` é gerado automaticamente.

| Arquivo | URL | Observação |
| --- | --- | --- |
| `__root.tsx` | — | Shell global; preservar `<Outlet />` |
| `auth.tsx` | `/auth` | Login (sem cadastro público) |
| `reset-password.tsx` | `/reset-password` | Redefinição de senha |
| `_authenticated/route.tsx` | — | Layout da área logada: guarda de auth, `CrmProvider` e `AppShell` |
| `_authenticated/index.tsx` | `/` | Tela inicial da área logada |
| `_authenticated/imoveis.index.tsx` | `/imoveis` | Catálogo de imóveis |
| `_authenticated/imoveis.novo.tsx` | `/imoveis/novo` | Cadastro de imóvel |
| `_authenticated/imoveis.$id.tsx` | `/imoveis/:id` | Detalhe do imóvel |
| `_authenticated/equipe.tsx` | `/equipe` | Gestão da equipe |
| `_authenticated/imobiliaria.tsx` | `/imobiliaria` | Perfil da imobiliária |

> Descrições das telas inferidas pelos nomes de arquivo; confirme no código ao alterar.

## Autenticação

- `_authenticated/route.tsx` usa `beforeLoad` com `supabase.auth.getUser()` e redireciona para `/auth` se não houver usuário.
- `ssr: false` nesse layout: a sessão fica no storage do navegador, o servidor não a enxerga.
- **Cadastro público desativado.** Admin cria corretores pela server function `createTeamMember` (`src/lib/crm/team.functions.ts`).
- A **primeira conta** criada no sistema vira `admin` (trigger `handle_new_user`); as demais viram `corretor`.

## Fluxo de dados

1. `CrmProvider` (`src/lib/crm/store.tsx`) chama `reload()` ao montar e busca em paralelo: `profiles`, `user_roles`, `properties`, `leads`, `interactions`.
2. Converte linhas do banco (snake_case) para os tipos de `src/lib/crm/types.ts` (camelCase) e guarda em estado React.
3. Escritas são **otimistas**: atualiza o estado local e dispara o `insert/update` no Supabase; em erro, `fail()` mostra um toast.
4. `useCrm()` expõe estado e ações (`moveLead`, `addInteraction`, `addLead`, `addProperty`, `reload`...).
5. Mover lead de etapa também registra uma interação do tipo `etapa`; interações de contato (`ligacao`, `whatsapp`, `visita`, `nota`) atualizam `last_contact_at`.

## Permissões

- **Fonte de verdade: RLS no Postgres** (ver `DATABASE.md`). Corretor só lê/escreve leads onde `owner_id = auth.uid()`; admin vê tudo.
- **"Simular como"** (`viewer` no store): só admin pode usar, e apenas **restringe** a visão no cliente. `visibleLeads()` em `rules.ts` aplica o filtro.
- Server function `createTeamMember` re-checa `has_role(userId, 'admin')` no servidor antes de criar usuário.

## Server functions

- Definidas com `createServerFn` de `@tanstack/react-start`, com middleware `requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`).
- Cliente com service role (`supabaseAdmin`) só em `client.server.ts`, importado dinamicamente dentro do handler: `const { supabaseAdmin } = await import("@/integrations/supabase/client.server")`.
- Arquivos de rota e `*.functions.ts` entram no bundle do cliente — nunca importar código server-only no topo deles.

## Regras de negócio (`src/lib/crm/rules.ts`)

Funções puras, testadas em `rules.test.ts`:

- `STAGES`, `OPEN_STAGES`: etapas do funil (`novo`, `contato`, `visita`, `proposta`, `ganho`, `perdido`)
- `visibleLeads` / `canSeeLead`: visibilidade por papel
- `smartMatch`: pesos tipo 40, orçamento 40, bairro 20; compatível com score ≥ 60; ignora imóveis `vendido`; tolerância de orçamento `BUDGET_TOLERANCE` (10%)
- `waLink`, `contextualMessage`, `propertySheet`: links e mensagens de WhatsApp por etapa
- `contactUrgency`: ok (<3 dias), warn (3–6), late (7+)
- Formatação: `brl`, `brlCompact`, `formatPhone`, `normalizePhone`

## Imagens

Fotos de imóveis usam `asset:<chave>` (arquivos em `src/assets/prop-*.jpg`) ou data URL de upload. `img()` em `src/lib/crm/images.ts` resolve a referência.
