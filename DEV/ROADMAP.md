# Roadmap

Estado atual das melhorias planejadas e resumo das funcionalidades entregues.

## O que já está 100% pronto e conectado
- **Funil Kanban:** arrastar e soltar leads, WhatsApp rápido com mensagem contextual, busca e filtros.
- **Ficha 360° do Lead:** histórico de interações (anotações e agendamento de visitas) e cruzamento inteligente (Smart Match) com os imóveis da base.
- **Gestão de Imóveis:** cadastro completo, edição de dados e fotos, alternador de status (Disponível, Reservado, Vendido) e upload direto no Supabase Storage (`property-photos`).
- **Exclusão de Leads e Imóveis:** Exclusão definitiva implementada (`deleteLead` para corretores/admin, `deleteProperty` para admin) com diálogo de confirmação (`ConfirmDelete`) e regras de RLS.
- **Página Pública do Imóvel (`/imovel/$id`):** vitrine sem login para o cliente final, com galeria, botão fixo de WhatsApp e formulário "Tenho interesse" que cria o lead direto no funil.
- **Compartilhamento Nativo:** abre WhatsApp, AirDrop e apps instalados no celular com 1 toque.
- **Autenticação e Permissões:** login com e-mail/senha e Google (SDK nativo do Supabase), cadastro de corretores restrito ao Dono/Admin e segurança via banco de dados (RLS).
- **Notificação / Alerta de Novos Leads:** Badge de contagem no topo do CRM para novos leads vindos da página pública.
- **Exportação de Leads (CSV):** Botão "Exportar CSV" no Funil para administradores baixarem a listagem filtrada de clientes com codificação UTF-8 (BOM) para o Excel.
- **Importação de Leads (CSV):** Importação em lote (`ImportLeadsDialog`) com pré-visualização, validação de dados e normalização de telefones, acessível a administradores no Funil.
- **Edição de Perfil e Dados da Imobiliária:** Corretores editam nome, telefone e CRECI em seu perfil; Donos/Admins editam nome, CRECI, endereço, cidade, telefone, responsável da imobiliária e upload direto da logo da imobiliária (tabela `agency` persistida com RLS).
- **Desacoplamento Completo e Deploy (Fases 1 a 5):** Concluído. Sistema 100% independente do Lovable, rodando em produção na Vercel com Supabase próprio, OAuth nativo e Storage configurado.

## Próximas Melhorias Planejadas

### 1. Dashboard de Métricas e KPIs
- Painel gerencial dedicado para acompanhar a saúde do funil de vendas.
- Gráficos de conversão por etapa, volume de vendas no mês e produtividade por corretor (utilizando `recharts`).

### 2. Notificações em Tempo Real (Supabase Realtime)
- Atualização instantânea da interface e badge de novos leads vindos da página pública sem necessitar de recarregamento manual.

### 3. Templates de Mensagem de WhatsApp Personalizáveis
- Tela de configuração para administradores e corretores adaptarem os textos padrão de abordagem por etapa do funil.

### 4. Arquivamento e Lixeira (Soft Delete)
- Alternativa à exclusão definitiva, permitindo mover leads ou imóveis para uma área de arquivados/lixeira com opção de restauração.

### 5. Captação Automática de Leads via Webhook
- Integração de server functions para receber leads de portais imobiliários (OLX, Zap, VivaReal) e campanhas do Meta Ads diretamente no funil.
