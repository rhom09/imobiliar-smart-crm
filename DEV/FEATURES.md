# Funcionalidades

> Estado atual das funcionalidades 100% prontas e conectadas no repositório. Planejamento de melhorias futuras: `ROADMAP.md`.

## Funil Kanban de oportunidades

- Etapas: Novo Lead, Contato Feito, Visita Agendada, Proposta Enviada, Fechado (Ganho), Perdido.
- Cards com drag-and-drop (`@dnd-kit/core`), nome do cliente, imóvel/orçamento, urgência do último contato e botão rápido de WhatsApp com mensagem contextual por etapa.
- Busca e filtros. Mover de etapa grava interação.

## Ficha 360° do lead (`LeadDrawer`)

- Abas **Smart Match**, **Histórico** e **Contato**.
- Histórico: notas, ligações, WhatsApp e **agendamento de visitas** (data/hora + imóvel).
- Smart Match: cruzamento inteligente com os imóveis da base por tipo, orçamento e bairro. Ações: compartilhar link e enviar ficha por WhatsApp.
- **Exclusão de cliente:** Exclusão definitiva com confirmação (`ConfirmDelete`), permitida ao dono do lead ou admin (via RLS).

## Gestão de imóveis

- Catálogo completo, cadastro, edição e detalhamento de imóveis.
- Fotos: upload direto para o Supabase Storage (`property-photos`).
- Alternador de status (Disponível, Reservado, Vendido).
- **Exclusão de imóvel:** Exclusão definitiva com confirmação, restrita a administradores.
- Código automático `MOR-xxxx`.

## Página Pública do Imóvel (`/imovel/$id`)

- Vitrine sem login para o cliente final, com galeria de fotos e metatags Open Graph para compartilhamento.
- Botão fixo de WhatsApp.
- Formulário "Tenho interesse" que cria o lead diretamente no funil Kanban na etapa "Novo Lead".

## Compartilhamento Nativo

- Integração nativa para abrir WhatsApp, AirDrop e apps instalados no celular com 1 toque.

## Autenticação e Permissões

- Login com e-mail/senha e **Google (via SDK nativo do Supabase)**, recuperação de senha (`/reset-password`).
- Cadastro de corretores restrito ao Dono/Admin (`createTeamMember`).
- Segurança garantida pelo banco de dados (RLS): o corretor enxerga apenas os próprios clientes.
- **Desacoplamento completo do Lovable:** Sistema 100% independente, sem dependências de pacotes de preview ou cloud-auth proprietários.

## Exportação, Importação e Perfil / Imobiliária

- **Exportação de leads (CSV):** Funcionalidade para administradores baixarem a lista de leads do funil em formato CSV (UTF-8 com BOM).
- **Importação de leads (CSV):** Funcionalidade para administradores importarem leads em lote via CSV com validação prévia de dados.
- **Edição de Perfil e Dados da Imobiliária com Upload de Logo:** Corretores editam nome, telefone e CRECI em `/imobiliaria`; administradores editam dados institucionais e fazem upload direto da logo da imobiliária para o Supabase Storage (tabela `agency` com RLS).

## Notificações em Tempo Real (Supabase Realtime)

- Assinatura automática via canais do Supabase Realtime para tabelas `leads` e `properties`.
- Alertas visuais instantâneos via `sonner` toasts (ex: novo lead cadastrado pela página pública ou novo imóvel adicionado) com sincronização e revalidação de estado em tempo real.

## Hospedagem e Produção

- **Deploy na Vercel:** Sistema publicado em produção com domínio próprio na Vercel e integração com o Supabase nativo.
