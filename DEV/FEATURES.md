# Funcionalidades

> Baseado no código atual do repositório. Itens marcados "a confirmar" não foram verificados em detalhe. Planejamento do que falta: `ROADMAP.md`.

## Funil Kanban de oportunidades

- Etapas: Novo Lead, Contato Feito, Visita Agendada, Proposta Enviada, Fechado (Ganho), Perdido.
- Cards com drag-and-drop (`@dnd-kit/core`), nome do cliente, imóvel/orçamento, urgência do último contato (ok/warn/late) e botão rápido de WhatsApp com mensagem contextual por etapa.
- Busca e filtros (a confirmar o escopo exato dos filtros no `index.tsx`).
- Componentes: `KanbanBoard`, `LeadCard`. Mover de etapa grava interação `etapa`.

## Ficha 360° do lead (`LeadDrawer`)

- Abas **Smart Match**, **Histórico** e **Contato**.
- Histórico: notas, ligações, WhatsApp e **agendamento de visitas** (data/hora + imóvel); próximas visitas em destaque.
- Smart Match: imóveis compatíveis por tipo (40), orçamento (40) e bairro (20), mínimo 60, sem vendidos. Ações: compartilhar link do imóvel e enviar ficha por WhatsApp (registra interação).
- Ações rápidas: WhatsApp contextual, ligar, e-mail, mudar etapa.
- **Excluir cliente** (exclusão definitiva com confirmação, via `ConfirmDelete`; apaga também o histórico). Quem pode: dono do lead ou admin (RLS).

## Gestão de imóveis

- Catálogo (`/imoveis`) com cadastro (`/imoveis/novo`), **edição** (`/imoveis/$id/editar`) e detalhe (`/imoveis/$id`), todos com o `PropertyForm`.
- **Fotos:** upload direto do dispositivo para o Storage do Lovable Cloud (bucket `property-photos`). O navegador redimensiona para no máximo 1600 px (JPEG ~82%) antes de enviar; até 12 arquivos por seleção; exige pelo menos 1 foto; a primeira é a capa. Também dá para usar fotos de exemplo (`asset:*`).
- **Situação** do imóvel (Disponível, Reservado, Vendido) alternável direto na ficha.
- Corretor responsável: admin escolhe; corretor cadastra já como responsável.
- **Excluir imóvel:** só admin, com confirmação. A página pública deixa de abrir e os leads interessados continuam no funil (o vínculo é zerado).
- Leads compatíveis com o imóvel listados na ficha, com envio de ficha por WhatsApp.
- Código automático `MOR-xxxx`.

## Página pública do imóvel (`/imovel/$id`)

- Sem login. Renderizada com loader no servidor (permite pré-visualização do link com título e foto do imóvel, via metatags Open Graph).
- Mostra galeria, preço, condomínio/IPTU, especificações, descrição, diferenciais e corretor responsável (nome e CRECI). **Não mostra endereço** nem dados de leads. Não há mapa.
- Botão fixo "Falar no WhatsApp" (mensagem pronta com o código do imóvel) e botão **Compartilhar**.
- Formulário **"Tenho interesse"** (nome + WhatsApp): cria um lead em **Novo Lead** com `source = "Página pública"`, atribuído ao corretor do imóvel (ou ao primeiro admin se o imóvel não tiver corretor). Ignora duplicata do mesmo telefone + imóvel em 24h.
- Dados vêm de `getPublicProperty` e `submitInterest` (`src/lib/crm/public.functions.ts`).

## Compartilhamento

- `shareLink` (`src/lib/crm/share.ts`) usa o compartilhamento nativo do dispositivo (WhatsApp, AirDrop, apps instalados) e cai para copiar link quando não disponível (a confirmar o fallback).
- Os links compartilhados apontam para a página pública `/imovel/$id`.

## Autenticação e permissões

- Login por **e-mail e senha** e por **Google** (`/auth`), recuperação de senha (`/reset-password`).
- Sem cadastro público: contas são criadas por admin (`createTeamMember`). No login com Google, a conta precisa já estar cadastrada.
- Papéis `admin` e `corretor`; o corretor só vê os próprios leads (RLS). "Simular como" permite ao admin ver a tela como um corretor (só restringe a visão).

## Imobiliária e equipe

- `/imobiliaria`: banner de perfil, KPIs (leads, em negociação, conversão, **VGV fechado**, **pipeline aberto**), distribuição do funil, **ranking da equipe** (VGV, vendas, conversão, visitas, propostas; só admin) e tabela de permissões.
- O valor de cada lead nas métricas vem do preço do imóvel de interesse ou, se não houver, do orçamento máximo.
- Os dados da imobiliária (nome, CRECI, telefone, endereço, responsável) são **fixos de demonstração** (`AGENCY` em `src/lib/crm/seed.ts`), assim como o card "Morada Pro / x de 10 usuários".
- `/equipe` (gestão de corretores) é acessada pelo botão "Gerenciar equipe" em `/imobiliaria`, só para admin (a confirmar detalhes da tela).

## Publicação e código

- Publicação feita pelo Lovable; código sincronizado automaticamente com o GitHub.

## Ainda não existe

Arquivar imóveis/leads (só exclusão definitiva), aviso de novo lead, edição de perfil do corretor e da imobiliária, exportação CSV/Excel, formulário de captação fora da página do imóvel, tempo de resposta por corretor. Ver `ROADMAP.md`.
