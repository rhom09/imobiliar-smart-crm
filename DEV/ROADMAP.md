# Roadmap

Estado atual das melhorias planejadas e resumo das funcionalidades entregues.

## O que já está 100% pronto e conectado
- **Funil Kanban:** arrastar e soltar leads, WhatsApp rápido com mensagem contextual, busca e filtros.
- **Ficha 360° do Lead:** histórico de interações (anotações e agendamento de visitas) e cruzamento inteligente (Smart Match) com os imóveis da base.
- **Gestão de Imóveis:** cadastro completo, edição de dados e fotos, alternador de status (Disponível, Reservado, Vendido) e upload direto no Lovable Cloud.
- **Página Pública do Imóvel (`/imovel/$id`):** vitrine sem login para o cliente final, com galeria, botão fixo de WhatsApp e formulário "Tenho interesse" que cria o lead direto no funil.
- **Compartilhamento Nativo:** abre WhatsApp, AirDrop e apps instalados no celular com 1 toque.
- **Autenticação e Permissões:** login com e-mail/senha e Google, cadastro de corretores restrito ao Dono/Admin e segurança via banco de dados (RLS).
- **Sincronização com GitHub:** todo o código atualizado automaticamente no repositório.

## Pendências para fechar com chave de ouro

### 1. Excluir ou arquivar imóveis e leads
- **Hoje:** só existe exclusão definitiva (`deleteLead`, `deleteProperty`). Não há arquivamento.
- **Objetivo:** esconder sem apagar (imóvel cadastrado errado, limpeza de leads de teste).
- **Atenção:** exigiria coluna nova (`archived_at`) em migration, ajuste das policies/queries e filtro no store.

### 2. Notificação / Alerta de novos leads
- **Objetivo:** Aviso visual (badge de contagem) no topo do CRM quando houver novos leads vindos da página pública.
- **Atenção:** Respeitar o RLS (corretor só é avisado dos próprios leads).

### 3. Edição de perfil e dados da imobiliária
- **Objetivo:** Permitir que cada corretor edite telefone, CRECI e foto de perfil, e que o Dono edite dados e logo da imobiliária.
- **Atenção:** Nova tabela `agency` com RLS, colunas de avatar/logo no Storage.

### 4. Exportação de leads (CSV / Excel)
- **Objetivo:** Baixar planilha com a lista de clientes para backup ou relatórios gerenciais.
- **Atenção:** Exportar somente o que o usuário já enxerga (respeitando RLS); tratar caracteres especiais e BOM para Excel.

### 5. Publicação (Deploy / Domínio Próprio)
- **Objetivo:** Sistema no ar com domínio próprio (ex.: `crm.suaimobiliaria.com.br`) para uso oficial da equipe.
- **Atenção:** Atualizar Site URL e Redirect URLs do Auth (Google e redefinição de senha).

