# Funcionalidades

> Estado atual das funcionalidades 100% prontas e conectadas no repositório. Planejamento de melhorias: `ROADMAP.md`.

## Funil Kanban de oportunidades
- Etapas: Novo Lead, Contato Feito, Visita Agendada, Proposta Enviada, Fechado (Ganho), Perdido.
- Cards com drag-and-drop (`@dnd-kit/core`), nome do cliente, imóvel/orçamento, urgência do último contato e botão rápido de WhatsApp com mensagem contextual por etapa.
- Busca e filtros. Mover de etapa grava interação.

## Ficha 360° do lead (`LeadDrawer`)
- Abas **Smart Match**, **Histórico** e **Contato**.
- Histórico: notas, ligações, WhatsApp e **agendamento de visitas** (data/hora + imóvel).
- Smart Match: cruzamento inteligente com os imóveis da base por tipo, orçamento e bairro. Ações: compartilhar link e enviar ficha por WhatsApp.
- Exclusão de cliente (dono/admin) com confirmação.

## Gestão de imóveis
- Catálogo completo, cadastro, edição e detalhamento de imóveis.
- Fotos: upload direto para o Storage do Lovable Cloud (`property-photos`).
- Alternador de status (Disponível, Reservado, Vendido).
- Código automático `MOR-xxxx`.

## Página Pública do Imóvel (`/imovel/$id`)
- Vitrine sem login para o cliente final, com galeria de fotos e metatags Open Graph para compartilhamento.
- Botão fixo de WhatsApp.
- Formulário "Tenho interesse" que cria o lead diretamente no funil Kanban na etapa "Novo Lead".

## Compartilhamento Nativo
- Integração nativa para abrir WhatsApp, AirDrop e apps instalados no celular com 1 toque.

## Autenticação e Permissões
- Login com e-mail/senha e Google (`/auth`), recuperação de senha (`/reset-password`).
- Cadastro de corretores restrito ao Dono/Admin (`createTeamMember`).
- Segurança garantida pelo banco de dados (RLS): o corretor enxerga apenas os próprios clientes.

## Sincronização com GitHub
- Todo o código atualizado automaticamente no repositório conectado.
- Publicação inicial integrada com o Lovable.

## Ainda não implementado (Ver `ROADMAP.md`)
- Arquivamento de imóveis e leads (além da exclusão existente).
- Notificação / alerta de novos leads no topo do CRM.
- Edição de perfil (corretor) e dados da imobiliária (dono).
- Exportação de leads (CSV/Excel).
- Deploy com domínio próprio.
