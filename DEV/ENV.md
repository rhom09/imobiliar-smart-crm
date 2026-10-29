# Ambiente e setup local

## Variáveis

Modelo em `.env.example` (nunca coloque valores reais de segredos em docs ou commits).

| Variável                        | Onde é usada                        | Segredo?              |
| ------------------------------- | ----------------------------------- | --------------------- |
| `VITE_SUPABASE_URL`             | cliente (browser)                   | não                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | cliente (browser)                   | não (chave pública)   |
| `VITE_SUPABASE_PROJECT_ID`      | cliente                             | não                   |
| `SUPABASE_URL`                  | servidor (server functions)         | não                   |
| `SUPABASE_PUBLISHABLE_KEY`      | servidor                            | não                   |
| `SUPABASE_PROJECT_ID`           | servidor                            | não                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | servidor, **só** `client.server.ts` | **SIM** — bypassa RLS |

## Setup local

```bash
git clone <repo>
cd <repo>
cp .env.example .env     # preencha os valores
bun install              # ou npm install
bun run dev
```

## Atenção: backend no Lovable Cloud

- O banco e a auth rodam no **Lovable Cloud**. O `.env` do repositório aponta para esse backend.
- `SUPABASE_SERVICE_ROLE_KEY` **não** vem no repositório. Sem ela, a server function `createTeamMember` (cadastro de corretor) falha localmente com "Missing Supabase environment variable(s)". As demais telas funcionam só com a chave pública.
- Para obter a chave de serviço ou migrar para um Supabase próprio, é preciso configurar fora do código (painel do Lovable Cloud / Supabase). Nunca commitar essa chave.
- O `.env` atual do projeto é commitado e contém apenas valores públicos; confirme no `.gitignore` o que deve ou não ser versionado antes de adicionar qualquer segredo.

## Deploy

Publicação hoje é feita pelo Lovable. Se sair do Lovable, será preciso definir hospedagem (o projeto usa `nitro` no build do TanStack Start) e configurar as variáveis acima no provedor escolhido.
