# Imobiliar Smart CRM

Crie um CRM imobiliário moderno com arquitetura SaaS para vendas de imóveis.

Principais funcionalidades e telas:
1. Quadro Kanban de Oportunidades (Funil de Vendas):
   - Etapas: Novo Lead, Contato Feito, Visita Agendada, Proposta Enviada, Fechado (Ganho), Perdido.
   - Cards com arrastar e soltar (drag-and-drop), contendo nome do cliente, imóvel/orçamento, tempo desde o último contato e botão rápido de WhatsApp (abrindo wa.me com mensagem contextual).
2. Drawer / Modal 360° do Lead:
   - Dados de contato, histórico de interações (notas e agendamentos).
   - Smart Match: cruzamento automático com base em orçamento, tipo de imóvel e bairro, exibindo imóveis compatíveis e botão para copiar link ou enviar ficha no WhatsApp.
3. Catálogo de Imóveis:
   - Listagem com busca e filtros (tipo, preço, quartos, bairro).
   - Cadastro e visualização de imóvel com galeria de fotos, especificações completas e botão de compartilhamento.
4. Perfil e Visão da Imobiliária:
   - Alternador de papéis no topo/sidebar (Simular como: Dono/Admin vs Corretor) para demonstrar a regra de permissão onde o corretor vê apenas seus clientes e o dono tem visão geral.
   - Design moderno, limpo, responsivo (mobile-first otimizado para o corretor usar na rua) com Tailwind CSS e componentes shadcn/ui.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/88bd6f4a-0e41-4346-aa3d-38c710f02435).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
