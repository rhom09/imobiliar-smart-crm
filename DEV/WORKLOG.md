# Worklog

Record a short summary here after substantive work.

Use `HANDOFF.md` for the current snapshot and `HANDOFFS/WORKLOG_ARCHIVE.md` for older entries after compaction.

## Template

```text
## YYYY-MM-DD - Short task title

- Spec: `DEV/SPECS/ACTIVE.md` or equivalent task doc
- Changed: paths or areas touched
- Why: one sentence
- Verified: command or manual check
- Risks: only active risks
- Next context: only what the next AI needs
```

## 2026-10-30 - Migração Fase 2 e 3: Desacoplamento do Ecossistema Lovable

- Spec: `DEV/MIGRATION.md`
- Changed: `src/routes/auth.tsx`, `src/integrations/supabase/client.ts`, `src/routes/__root.tsx`, `src/integrations/lovable/` (removido/desativado)
- Why: Retirar dependências do `@lovable.dev/cloud-auth-js` e `@lovable.dev/vite-tanstack-config`, migrando o login Google para o SDK nativo do Supabase e limpando stubs de telemetria Lovable.
- Verified: `bun run build` e `bun run test` executados com sucesso (12/12 testes passando).
- Risks: Nenhum; dependências proprietary removidas com build e SSR validados.
- Next context: Projeto pronto para deploy na Vercel (Fase 5) conectado ao Supabase próprio.


## 2026-10-29 - Implementação da Edição de Perfil e Dados da Imobiliária

- Spec: `DEV/ROADMAP.md` (Item 2)
- Changed: `drizzle/migrations/0001_agency.sql`, `src/lib/crm/store.tsx`, `src/routes/_authenticated/imobiliaria.tsx`, `DEV/FEATURES.md`, `DEV/ROADMAP.md`
- Why: Permitir que corretores editem seu perfil (nome, telefone, CRECI) e administradores editem dados cadastrais da imobiliária (tabela `agency` com RLS).
- Verified: `npx tsc --noEmit` e `npx vitest run` executados com sucesso (12 testes passando).
- Risks: Nenhum.
- Next context: Próximo item do roadmap opcional (arquivamento de leads/imóveis) ou deploy/domínio próprio.

## 2026-10-29 - Setup do Bun e restauração de dependências

- Spec: N/A (fix de ambiente e resolução de tipos TypeScript)
- Changed: Instalação do Bun em `~/.bun/bin/bun`, execução de `bun install`
- Why: Resolver ausência de `node_modules` que causava erro de resolução de tipos `vite/client` no `tsconfig.json`
- Verified: `bun x tsc --noEmit` executado com sucesso (zero erros de tipo)
- Risks: Nenhum; `bun.lock` preservado
- Next context: Ambiente pronto para desenvolvimento via `bun run dev` ou testes com `bun run test`

## 2026-10-29 - Implementação da Exportação de Leads para CSV

- Spec: `DEV/SPECS/ACTIVE.md`
- Changed: `src/lib/crm/export.ts`, `src/routes/_authenticated/index.tsx`, `DEV/FEATURES.md`, `DEV/ROADMAP.md`
- Why: Permitir que administradores exportem a lista de leads do funil em formato CSV com suporte a UTF-8/BOM para Excel.
- Verified: Botão "Exportar CSV" adicionado e integrado na interface do Funil (`/`).
- Risks: Nenhum.
- Next context: Funcionalidade entregue e documentada. Pronto para o próximo item do roadmap.
