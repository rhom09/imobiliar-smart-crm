# Migração: sair do Lovable

> **Status: planejamento. Não executar nada deste documento sem o dono do projeto pedir explicitamente.** A decisão de migrar ainda não foi tomada. Enquanto isso, o projeto continua sincronizando com o Lovable e as regras do `CLAUDE.md` valem.

Objetivo: rodar o projeto sem depender do Lovable (backend, build e hospedagem), sem quebrar o que já funciona.

## 1. Dependências do Lovable hoje

| Item                                          | Onde                                                                                      | O que fazer na migração                                                                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend (Lovable Cloud = Supabase gerenciado) | banco, auth, `SUPABASE_*`                                                                 | Criar Supabase próprio e migrar schema, dados e usuários                                                                                                |
| Config do Vite                                | `vite.config.ts` usa `@lovable.dev/vite-tanstack-config`                                  | Trocar por config explícita (ver seção 5)                                                                                                               |
| Login social via Lovable                      | `@lovable.dev/cloud-auth-js`, `src/integrations/lovable/index.ts`                         | **Verificar se `src/routes/auth.tsx` usa `lovable.auth`.** Se só há e-mail/senha, remover. Se há login social, reconfigurar provedor direto no Supabase |
| Preview auth / cron auth                      | `src/integrations/supabase/previewAuthStorage.ts`, `cron-auth.ts`                         | **Ler antes de decidir.** Podem ser específicos do ambiente Lovable                                                                                     |
| Error reporting do Lovable                    | `src/lib/lovable-error-reporting.ts`, `src/lib/error-capture.ts`, `src/lib/error-page.ts` | Avaliar remoção e conferir quem importa esses arquivos (`src/server.ts`, `__root.tsx`)                                                                  |
| Metadados do Lovable                          | `.lovable/`, bloco `LOVABLE:BEGIN/END` do `AGENTS.md`                                     | Remover só ao desconectar de vez                                                                                                                        |
| Hospedagem                                    | publicação pelo Lovable                                                                   | Escolher host (ver seção 6)                                                                                                                             |

Observação: não há edge functions no repositório (sem `supabase/functions`). A lógica de servidor são server functions do TanStack Start (`createTeamMember`), que vão junto com o app.

## 2. Antes de começar

- Decidir se há **dados reais** (leads, usuários) ou só teste. Só teste → recriar do zero é mais simples e seguro.
- Trabalhar em **branch separada**. Não apagar nem pausar o projeto no Lovable até tudo estar validado.
- Não reescrever histórico git publicado.
- Nunca commitar `SUPABASE_SERVICE_ROLE_KEY`. O repositório é público.
- Fazer a migração **antes** de implementar Storage de fotos (item 1 do `ROADMAP.md`), para não ter arquivos para migrar.

## 3. Banco de dados e usuários

1. Criar projeto no Supabase.
2. Aplicar o schema com `drizzle/migrations/0000_crm_core.sql` (tabelas, enum, RLS, `has_role`, `can_access_lead`, `handle_new_user` e trigger, sequência, seed). Ideal: mover para a convenção do Supabase CLI (`supabase/migrations/`) e usar `supabase db push` após `supabase link`.
3. **Cuidado com o trigger `handle_new_user`:** a primeira conta criada vira `admin`. Em banco novo, a primeira conta é a do dono. Se migrar usuários existentes, garanta que os papéis em `user_roles` venham corretos (não deixe o trigger reatribuir).
4. Migrar dados (`profiles`, `user_roles`, `properties`, `leads`, `interactions`) e usuários de `auth.users`. Existem exportadores da comunidade que levam tabelas, usuários com senha e storage, e o Lovable oferece opção de export do Cloud. **Confirmar o método atual na documentação do Lovable**, pois é terceiros/recente. Validar contagem de linhas por tabela antes e depois.
5. Se os usuários migrarem com hash de senha, ninguém precisa redefinir senha. Testar com uma conta real.
6. Regenerar tipos: `supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`.

## 4. Configuração de Auth no novo projeto (crítico)

- **Desativar cadastro público.** Hoje isso é configuração do projeto, não código. Se esquecer, qualquer pessoa cria conta e vira `corretor` pelo trigger.
- Definir **Site URL** e **Redirect URLs** (incluindo `/reset-password`) para o domínio novo e para `localhost`.
- Configurar **e-mail de auth** (reset de senha) com SMTP próprio; o remetente padrão do Supabase tem limite baixo.
- Se houver login social, criar as credenciais do provedor e cadastrar no Supabase.

## 5. Código e build

1. Remover do `package.json`: `@lovable.dev/cloud-auth-js` (se confirmado sem uso) e `@lovable.dev/vite-tanstack-config`.
2. Reescrever `vite.config.ts` com os plugins que o pacote do Lovable embutia, segundo o comentário do próprio arquivo: TanStack Start (com `server: { entry: "server" }` apontando para `src/server.ts`), `@vitejs/plugin-react`, Tailwind (`@tailwindcss/vite`), paths do tsconfig (`vite-tsconfig-paths`), nitro (apenas no build, com o preset do host escolhido), injeção de `VITE_*` e alias `@`. **Não escrever de memória:** seguir a documentação atual do TanStack Start e do nitro para a ordem dos plugins.
3. As versões são recentes/beta (`vite 8`, `nitro` beta, override de `rolldown`): **fixar versões exatas** e testar o build antes de mexer em mais nada.
4. Remover `src/integrations/lovable/` e arquivos de error reporting só depois de checar os imports (`grep -r lovable src`).
5. Variáveis de ambiente: ver `ENV.md`. Trocar URL, chave publishable e project id pelos do Supabase novo; configurar `SUPABASE_SERVICE_ROLE_KEY` no host (server function `createTeamMember`).
6. Rodar `bun run lint`, `bun run test` e `bun run build`.

## 6. Hospedagem

- O build atual já tem alvo Cloudflare por padrão (via config do Lovable); Cloudflare é o caminho de menor atrito. Outros hosts exigem trocar o preset do nitro.
- Configurar no host todas as variáveis (cliente `VITE_*` e servidor).
- Apontar domínio e atualizar Site URL/Redirect URLs do Supabase para ele.

## 7. Checklist de validação (não pular)

- [ ] Login e logout; reset de senha chega por e-mail e funciona
- [ ] Admin cria corretor (`createTeamMember`) com a service role configurada
- [ ] Corretor vê só os próprios leads; admin vê todos (testar com duas contas)
- [ ] "Simular como" só restringe, não amplia
- [ ] Kanban: mover lead grava a etapa e a interação
- [ ] Catálogo: listar, filtrar, cadastrar imóvel (código `MOR-xxxx` gerado), ver detalhe
- [ ] Smart Match e links de WhatsApp
- [ ] Cadastro público está desativado (tentar criar conta sem ser admin)
- [ ] `bun run lint && bun run test && bun run build` passam
- [ ] Contagens de linhas batem com o banco antigo

## 8. Corte final

1. Congelar escritas no sistema antigo (avisar a equipe) e fazer a última exportação.
2. Importar, validar o checklist e trocar o domínio/links.
3. Manter o projeto no Lovable por um período como backup antes de pausar ou remover.
4. Só então desconectar o GitHub do Lovable e limpar `.lovable/` e o bloco do `AGENTS.md`.

## 9. Riscos conhecidos

- Cadastro público ligado por esquecimento (brecha de segurança, ver seção 4).
- Usuários sem senha válida após a migração.
- `vite.config.ts` com plugins duplicados ou fora de ordem.
- E-mails de auth caindo em limite de envio ou spam.
- Dados novos criados no sistema antigo depois da última exportação.
- Arquivos que o código assume existirem só no ambiente Lovable (`previewAuthStorage.ts`, `cron-auth.ts`): ler antes de remover.

## Estimativa

Com dados de teste: algumas horas a 1 dia. Com usuários reais: cerca de 1 a 2 dias incluindo validação e corte. (Estimativa, não medida.)
