# Plano: Migração para uso regional (São Pedro-SP)

## Status

- [x] Migration SQL (`drizzle/migrations/0002_lead_cities.sql`) criada.
- [x] Novo arquivo `src/lib/crm/locations.ts` criado.
- [x] Atualizado `rules.ts` (PROPERTY_TYPES, normalizeText, smartMatch, contextualMessage).
- [x] Atualizado `types.ts` (Lead.cities).
- [x] Atualizado `store.tsx` (lead.cities).
- [x] Atualizado `NewLeadDialog.tsx` e `LeadDrawer.tsx`.
- [x] Atualizado `PropertyForm.tsx`.
- [x] Atualizado `imoveis.index.tsx` (Price Ranges, filtros de cidade/bairro).
- [x] Atualizado `index.tsx` (Funil search).
- [x] Atualizado `public.functions.ts` e import/export CSV.
- [x] Atualizado `rules.test.ts` e criado `locations.test.ts`.
- [x] Atualizado `DEV/FEATURES.md`, `DEV/DATABASE.md`, `DEV/CONVENTIONS.md`.
- [x] Rodar lint, test, build.
