# Roadmap

Estado atual das melhorias planejadas. O que já existe está em `FEATURES.md`; aqui ficam o que foi entregue (resumo) e o que falta, com os cuidados técnicos que o Claude Code deve respeitar. Antes de implementar, leia `ARCHITECTURE.md` e `DATABASE.md`.

## Já entregue (resumo)

- **Storage de fotos:** upload para o bucket `property-photos` (referência `storage:<path>` no banco).
- **Página pública do imóvel** `/imovel/$id` com galeria, WhatsApp fixo e formulário "Tenho interesse" que cria o lead no funil.
- **Exclusão** de leads (dono/admin) e de imóveis (admin), com confirmação.
- **Métricas parciais** em `/imobiliaria`: VGV fechado, pipeline aberto, conversão e ranking da equipe.
- **Login Google** além de e-mail/senha.

## Pendências

### 1. Arquivar imóveis e leads

- **Hoje:** só existe exclusão definitiva (`deleteLead`, `deleteProperty`). Não há arquivamento.
- **Objetivo:** esconder sem apagar (imóvel cadastrado errado, limpeza de leads de teste).
- **Atenção:** exigiria coluna nova (ex.: `archived_at`) em migration, ajuste das policies/queries e filtro no store. Decidir se "arquivado" some do Smart Match e da página pública (o ideal é a página pública deixar de abrir).

### 2. Aviso de novos leads

- **Hoje:** o lead da página pública entra direto na coluna Novo Lead, sem sinal visual.
- **Objetivo:** badge de contagem/aviso no topo do CRM para leads novos.
- **Atenção:** o store carrega os dados uma vez (`reload`); é preciso decidir entre polling, Supabase Realtime ou recarregar ao focar a aba. Definir "novo/não visto" (campo próprio, ex.: `seen_at`, ou leads em `novo` criados após a última visita). O corretor só deve ser avisado dos próprios leads (RLS).

### 3. Edição de perfil e dados da imobiliária

- **Hoje:** `profiles` tem `name`, `phone`, `creci`, mas não há tela para o corretor editar. Os dados da imobiliária vêm do objeto fixo `AGENCY` em `src/lib/crm/seed.ts` (demonstração) e o card "Morada Pro" também é fixo.
- **Objetivo:** corretor edita telefone, CRECI e foto; dono edita dados e logo da imobiliária.
- **Atenção:**
  - A policy de UPDATE de `profiles` já permite ao próprio usuário e ao admin; foto de perfil exige coluna nova (ex.: `avatar_url`) e storage.
  - Dados da imobiliária precisam de tabela própria (ex.: `agency`) com RLS: leitura para autenticados, escrita só admin. Remover `AGENCY` do seed ao migrar.
  - Logo/avatar em Storage: criar bucket e policies por migration (o bucket `property-photos` não deve ser reutilizado).
  - O telefone do corretor aparece na página pública (botão de WhatsApp); avisar o corretor disso na edição.

### 4. Exportação de leads (CSV/Excel)

- **Objetivo:** baixar planilha de clientes para backup e relatórios.
- **Atenção:** exportar **somente o que o usuário já enxerga** (`leads` do store, já filtrado por RLS/papel); admin exporta todos. Nunca usar `supabaseAdmin` para isso. Escapar campos (vírgulas, aspas, quebras de linha) e prefixar com BOM para abrir acentos no Excel. `xlsx` e `papaparse` não estão nas dependências hoje; avaliar CSV simples primeiro.

### 5. Publicação e domínio próprio

- **Hoje:** publicado pelo Lovable.
- **Objetivo:** sistema no ar para a equipe, com domínio próprio (ex.: `crm.suaimobiliaria.com.br`).
- **Atenção:** ao trocar o domínio, atualizar Site URL e Redirect URLs do Auth (inclui `/reset-password` e o retorno do login Google). Os links compartilhados de imóveis usam `window.location.origin`, então mudam junto com o domínio; links já enviados no WhatsApp com o domínio antigo precisam continuar funcionando (manter o domínio antigo ativo ou redirecionar).

### 6. Captação de leads fora da página do imóvel

- **Hoje:** só o formulário "Tenho interesse" da página pública cria lead.
- **Objetivo:** link/formulário para Instagram e site da imobiliária, sem imóvel específico.
- **Atenção:** reaproveitar o padrão de `submitInterest` (server function pública, validação, `supabaseAdmin` via import dinâmico); **não** abrir INSERT anônimo em `leads`. **Decisão em aberto:** quem recebe um lead sem imóvel (admin, rodízio entre corretores). `source` deve identificar a origem (ex.: "Instagram").

### 7. Dashboard do dono: o que falta

- **Já existe:** VGV fechado, pipeline aberto, conversão e ranking por corretor em `/imobiliaria`.
- **Falta:** VGV em negociação **por etapa** e **tempo de resposta** por corretor (ex.: do `created_at` do lead até a primeira interação de contato). Considerar filtro por período.
- **Atenção:** manter os cálculos como funções puras testadas em `rules.ts` (hoje a função `metrics` está dentro de `imobiliaria.tsx`; mover para `rules.ts` ao evoluir). Manter a definição atual de valor do lead (preço do imóvel de interesse, senão `budget_max`).

### 8. Ajustes da página pública e do Storage

- **Mapa:** a página pública não tem mapa (e não mostra endereço de propósito; decidir se mostra só bairro/região).
- **Situação do imóvel:** `getPublicProperty` devolve imóveis `reservado` e `vendido` sem sinalizar; definir o comportamento (aviso "Vendido", esconder o formulário, ou 404).
- **Formulário "Tenho interesse":** o campo `message` é validado no servidor mas **não é gravado** no lead; além da deduplicação de 24h por telefone+imóvel, não há limite de abuso (honeypot/rate limit).
- **Fotos órfãs:** remover foto no formulário ou excluir o imóvel não apaga o arquivo do bucket (pelo código lido); considerar limpeza. A DELETE no bucket só é permitida a admin.
- **Resolução:** o upload reduz para 1600 px; se for preciso resolução maior, ajustar `resizeImage` em `PropertyForm.tsx`.
- **Fotos antigas:** imóveis com data URL (formato anterior) continuam funcionando, mas pesam no banco; considerar migração para o bucket.
- **Links de pré-visualização:** as URLs assinadas de foto expiram em 7 dias; a imagem `og:image` usa essa URL. Avaliar bucket público para a capa se a prévia no WhatsApp falhar depois de dias.
