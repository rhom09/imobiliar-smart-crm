# Banco de dados

Postgres (Supabase gerenciado pelo Lovable Cloud). Fonte: `drizzle/migrations/0000_crm_core.sql`. Tipos TypeScript gerados em `src/integrations/supabase/types.ts` (não editar).

> `drizzle/schema.ts` está intencionalmente vazio (gerado). O schema real está nas migrations SQL.

## Enum

- `app_role`: `'admin' | 'corretor'`

## Tabelas

### `profiles`
`id` (PK, FK → `auth.users`, cascade), `name`, `email`, `phone`, `creci`, `created_at`.

### `user_roles`
`id`, `user_id` (FK → `auth.users`, cascade), `role` (`app_role`). `UNIQUE (user_id, role)`.

### `properties`
`id`, `code` (único, padrão `'MOR-' || nextval('property_code_seq')`, sequência inicia em 1100), `title`, `type`, `price`, `neighborhood`, `city` (padrão "São Paulo"), `address`, `bedrooms`, `suites`, `bathrooms`, `parking`, `area`, `condo`, `iptu`, `description`, `features text[]`, `photos text[]`, `broker_id`, `status` (`disponivel` | `reservado` | `vendido`), `created_at`.

### `leads`
`id`, `name`, `phone`, `email`, `owner_id` (corretor dono), `stage` (`novo` | `contato` | `visita` | `proposta` | `ganho` | `perdido`), `property_type`, `budget_min`, `budget_max`, `bedrooms`, `neighborhoods text[]`, `interest_property_id` (FK → `properties`, `ON DELETE SET NULL`), `source`, `created_at`, `last_contact_at`.

### `interactions`
`id`, `lead_id` (FK → `leads`, cascade), `kind` (`nota` | `ligacao` | `whatsapp` | `visita` | `etapa`), `text`, `at`, `scheduled_for` (visitas), `author_id` (padrão `auth.uid()`). Índice em `lead_id`.

## Funções e triggers

- `has_role(_user_id, _role)` — `SECURITY DEFINER`, usada em todas as policies de admin.
- `can_access_lead(_lead_id)` — `SECURITY DEFINER`; true se o usuário é dono do lead ou admin. Usada nas policies de `interactions`.
- `handle_new_user()` + trigger `on_auth_user_created` (em `auth.users`): cria `profiles` e define role. **Primeira conta = `admin`**, as demais = `corretor`.

## Políticas RLS (resumo)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | todos autenticados | — | próprio ou admin | — |
| `user_roles` | todos autenticados | — | — | — |
| `properties` | todos autenticados | todos autenticados | `broker_id = uid` ou `broker_id` nulo ou admin | só admin |
| `leads` | dono ou admin | dono ou admin | dono ou admin | dono ou admin |
| `interactions` | se `can_access_lead` | se `can_access_lead` e `author_id = uid` | — | — |

Todas as tabelas têm RLS habilitado. Papéis só são escritos pelo trigger e pelo service role.

## Regras ao alterar o banco

- Mudanças de schema = **nova migration** em `drizzle/migrations/` (nunca editar a `0000`). Toda tabela nova precisa de `ENABLE ROW LEVEL SECURITY` + policies + `GRANT` para `authenticated` e `service_role`.
- Nunca usar `supabaseAdmin` (bypassa RLS) para leituras comuns de usuário.
- O backend roda no **Lovable Cloud**: migrations locais não são aplicadas sozinhas. Aplique pelo Lovable (ou migre para um projeto Supabase próprio) e confirme antes de assumir que o banco mudou.
- Após mudar o schema, `src/integrations/supabase/types.ts` precisa ser regenerado.

## Seed

A migration insere 10 imóveis de exemplo (códigos `MOR-1021` a `MOR-1088`) com fotos `asset:*`.
