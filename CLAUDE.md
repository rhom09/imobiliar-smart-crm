# Imobiliar Smart CRM

CRM imobiliário (SaaS) para corretores: funil Kanban de leads, Smart Match de imóveis, catálogo de imóveis e compartilhamento via WhatsApp. Projeto originado no Lovable (ver "Regras do Lovable" abaixo). UI e textos em **português (pt-BR)**.

## Stack

- **TanStack Start** (React 19 + TanStack Router, rotas por arquivo) sobre **Vite**
- **Tailwind CSS v4** + **shadcn/ui** (Radix) — `src/components/ui/` é gerado, não editar à mão
- **Backend: Lovable Cloud** (Supabase gerenciado): Auth, Postgres com RLS, server functions
- **Drag-and-drop:** `@dnd-kit/core` · **Formulários:** react-hook-form + zod · **Toasts:** sonner
- **Testes:** Vitest + Testing Library · **Gerenciador de pacotes:** bun (`bun.lock`)

## Comandos

```bash
bun install        # ou npm install
bun run dev        # servidor de desenvolvimento
bun run build      # build de produção
bun run lint       # ESLint
bun run format     # Prettier
bun run test       # Vitest (uma execução)
bun run test:watch
```

## Mapa do código

```
src/routes/            Rotas (file-based). __root.tsx = shell. _authenticated/ = área logada
src/components/crm/    Componentes de domínio (Kanban, LeadCard, LeadDrawer, PropertyCard...)
src/components/ui/     shadcn/ui (gerado)
src/lib/crm/           Regras, tipos, store, server functions, seed
src/integrations/      Supabase e Lovable (arquivos gerados — não editar)
drizzle/migrations/    SQL do banco (schema, RLS, triggers, seed de imóveis)
```

## Regras críticas (leia antes de mexer)

1. **Regras de negócio ficam em `src/lib/crm/rules.ts`** (visibilidade de leads, Smart Match, links de WhatsApp, urgência de contato) com testes em `rules.test.ts`. Componentes **nunca** reimplementam essas regras.
2. **Permissão é garantida pelo banco (RLS)**, não pelo front. O "Simular como" do admin só restringe a visão no cliente; nunca amplia o que um corretor pode ler.
3. **Dados carregam no cliente** via `src/lib/crm/store.tsx` sob o layout `_authenticated` (`ssr: false`), com escrita otimista. A sessão fica no storage do navegador, por isso SSR não lê a sessão.
4. **Sem cadastro público.** Contas são criadas só por admin via server function `createTeamMember` (re-valida role no servidor). A primeira conta criada vira admin (trigger `handle_new_user`).
5. **Fotos de imóveis** são guardadas como `asset:<chave>` (ou data URL em uploads) e resolvidas por `img()` em `src/lib/crm/images.ts`. Nunca persistir caminhos com hash do bundle.
6. **Server-only:** `client.server.ts` (service role) só pode ser importado dentro de handlers via `await import(...)`. Arquivos de rota e `*.functions.ts` vão para o bundle do cliente.
7. **Não editar à mão:** `src/routeTree.gen.ts`, `src/integrations/**`, `src/components/ui/**`, `drizzle/schema.ts`.

## Regras do Lovable (se ainda sincronizar com ele)

- Nunca reescrever histórico git já publicado (force push, rebase, amend, squash).
- Commits na branch conectada sincronizam de volta para o Lovable — mantenha a branch funcionando.
- Não mover/renomear pastas sem avisar; não editar `.lovable/`.

## Rotas (TanStack Start)

Convenção: `users/$id.tsx` → `/users/:id` (apenas `$`, sem chaves). Não criar `src/pages/` nem layouts estilo Next/Remix. Detalhes em `src/routes/README.md`.

## Documentação detalhada

- `DEV/ARCHITECTURE.md` — fluxo de dados, rotas, autenticação, server functions
- `DEV/DATABASE.md` — tabelas, enums, RLS, funções e triggers
- `DEV/CONVENTIONS.md` — padrões de código e o que não fazer
- `DEV/DESIGN_SYSTEM.md` — cores, tipografia, componentes e padrões visuais (marca "Morada")
- `DEV/FEATURES.md` — funcionalidades e estado atual
- `DEV/ROADMAP.md` — melhorias planejadas (Storage, página pública do imóvel, captação de leads, dashboard) e seus cuidados técnicos
- `DEV/ENV.md` — variáveis de ambiente e setup local

Leia o doc relevante **antes** de alterar banco, autenticação ou regras de permissão.
