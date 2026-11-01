# Guia de Deploy na Vercel com Domínio Próprio e Configuração Supabase / Auth

Este guia detalha o processo de publicação do **Imobiliar Smart CRM** (TanStack Start + Supabase) na **Vercel**, incluindo a configuração de variáveis de ambiente, domínio próprio e ajustes necessários no Supabase Auth.

---

## 1. Pré-requisitos na Vercel

1. Tenha uma conta na [Vercel](https://vercel.com) e o repositório conectado (ou utilize a Vercel CLI).
2. Crie um novo projeto na Vercel apontando para o repositório do CRM.

---

## 2. Configuração de Variáveis de Ambiente na Vercel

No painel da Vercel (`Project Settings` > `Environment Variables`), adicione todas as variáveis de ambiente necessárias para os ambientes **Production**, **Preview** e **Development**:

| Variável | Descrição | Exemplo / Valor |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://seu-projeto.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública anônima do Supabase | `eyJhbGciOi...` |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase | `seu-projeto` |
| `SUPABASE_URL` | URL do Supabase (Servidor) | `https://seu-projeto.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase (Servidor) | `eyJhbGciOi...` |
| `SUPABASE_PROJECT_ID` | ID do projeto Supabase (Servidor) | `seu-projeto` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (Bypassa RLS) | `eyJhbGciOi...` **(Manter sigilo)** |

> **Atenção:** A `SUPABASE_SERVICE_ROLE_KEY` é obrigatória no ambiente de servidor para que funções administrativas (como a criação de corretores via server function `createTeamMember`) funcionem corretamente.

---

## 3. Configuração de Domínio Próprio

1. No painel do seu projeto na Vercel, acesse **Settings** > **Domains**.
2. Digite o seu domínio próprio (ex.: `crm.suaimobiliaria.com.br` ou `suaimobiliaria.com.br`) e clique em **Add**.
3. Siga as instruções de DNS fornecidas pela Vercel para configurar os registros necessários no seu provedor de domínio (Registro.br, Cloudflare, Route53, etc.):
   - **Registro Tipo A**: Apontando para o IP fornecido pela Vercel (geralmente `76.76.21.21`).
   - **Registro CNAME**: Para subdomínios (ex.: `cname.vercel-dns.com`).
4. Aguarde a propagação do DNS e a emissão automática do certificado SSL/TLS pela Vercel.

---

## 4. Configuração de Redirecionamento no Supabase (Auth)

Para garantir que o fluxo de autenticação, recuperação de senha e links mágicos funcionem perfeitamente no seu novo domínio e na Vercel:

1. Acesse o painel do **Supabase** do seu projeto.
2. Navegue até **Authentication** > **URL Configuration**.
3. Em **Site URL**, defina a URL oficial de produção (ex.: `https://crm.suaimobiliaria.com.br`).
4. Em **Redirect URLs**, adicione todas as URLs autorizadas de redirecionamento:
   - `https://crm.suaimobiliaria.com.br`
   - `https://crm.suaimobiliaria.com.br/**`
   - URLs de preview da Vercel (ex.: `https://*.vercel.app/**`) se desejar testar os deploys de Pull Request.
5. Clique em **Save**.

---

## 5. Verificação Pós-Deploy

1. Acesse a URL de produção na Vercel ou o seu domínio próprio.
2. Realize o login no CRM com uma conta de administrador.
3. Teste o cadastro de um novo imóvel, a criação de leads e a listagem regional.
4. Verifique no console do navegador e nos logs da Vercel se há erros de conexão com o Supabase ou de execução em Server Functions.
