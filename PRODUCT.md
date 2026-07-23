# Product

## Register

product

## Users

Desenvolvedores front-end (e agentes de IA) que adotam este template como ponto de partida para construir um novo produto React/TypeScript. O contexto de uso é o início de projeto: clonar a base, adaptar tokens e features às regras do produto real, e evoluir a partir de uma fundação já consistente. O "job to be done" é sair do zero para uma aplicação com arquitetura, design system e infraestrutura de API já resolvidos, sem reinventar o setup.

Como template, também serve o usuário final do produto derivado — tipicamente em superfícies de app: dashboards, telas autenticadas, formulários e ferramentas internas.

## Product Purpose

Template SPA React/Vite domain-neutral: fornece uma base pronta para produção com vertical feature slices, design system Cal.com-inspired (`/design-system`), autenticação, roteamento centralizado, camada de API feature-local (TanStack Query + Axios) e formulários (React Hook Form + Zod).

Existe para eliminar o custo de setup e as decisões repetidas de arquitetura no início de cada projeto, entregando convenções consistentes que qualquer produto pode herdar. Sucesso = um novo produto arranca com fundação sólida, mantém as convenções ao crescer, e o time gasta energia no domínio — não na plumbing.

## Brand Personality

Calmo, preciso, profissional. Voz sóbria e direta, sem ruído decorativo. A interface transmite confiança e foco pela restrição: hierarquia clara, espaçamento generoso, neutros com um único acento. Nada grita; tudo é legível e intencional. Por ser template, a identidade é deliberadamente enxuta para que cada produto derivado imponha a sua sem lutar contra a base.

## Anti-references

- **Denso e corporativo demais**: evitar o visual enterprise pesado — mar de cards, gradientes gratuitos, painéis lotados, tudo competindo por atenção.
- **Genérico "SaaS-cream"**: evitar o template SaaS clichê — hero-metric, eyebrows tracked em toda seção, marcadores 01/02/03 por reflexo, grids de cards idênticos com ícone + título + texto.
- **Fundo cream/sand/paper** como neutro padrão "para parecer editorial". A base usa branco/neutro real com acento único.

## Design Principles

- **Domain-neutral por padrão**: a base não assume regras de produto; o específico vive em `src/features/<feature>`. A fundação permanece adaptável.
- **Restrição gera confiança**: menos elementos, mais hierarquia. Um acento, espaçamento como ferramenta, sem decoração que não carregue informação.
- **Convenção acima de configuração**: usar o design system e os padrões existentes (Typography, FieldWrapper, overlays, notify) antes de criar novos — consistência sobre criatividade pontual.
- **Pronto para produção, não protótipo**: cada peça responsiva, acessível, com estados de erro/vazio/carregamento resolvidos.
- **A base some, o produto aparece**: a identidade do template cede espaço para a marca de quem o adota.

## Accessibility & Inclusion

Meta WCAG 2.1 AA. Texto de corpo ≥ 4.5:1 de contraste; texto grande ≥ 3:1; placeholders no mesmo padrão do corpo. Toda animação com alternativa em `@media (prefers-reduced-motion: reduce)`. Navegação por teclado e foco visível em todos os controles interativos (Radix já cobre a base). Não depender só de cor para transmitir estado.
