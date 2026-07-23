# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Commands

```bash
npm run dev              # Start Vite dev server with HMR
npm run build            # TypeScript compilation + Vite build
npm run build:dev        # Build for dev environment
npm run build:main       # Build for production environment
npm run lint             # ESLint check
npm run format           # Prettier format
npm run format:check     # Prettier check
npm run preview          # Preview production build locally
```

No test framework is configured.

## Architecture

This is a generic React/TypeScript SPA template built with Vite, React Router, Tailwind, Radix UI, TanStack Query and Axios. Keep it domain-neutral and adapt product-specific rules inside feature folders.

Use vertical feature slices. Domain UI, API, types, hooks, validation and local helpers belong in `src/features/<feature>`.

Shared infrastructure belongs in:

- `src/app`: providers, routing, global hooks, route constants and app-wide utilities.
- `src/components/ui`: reusable UI primitives.
- `src/components/modules`: reusable composed modules.
- `src/lib`: generic non-domain helpers.
- `src/lib/api`: shared API clients, types and utilities.

Do not recreate `src/api`. Domain API code belongs in `src/features/<feature>/api`.

## Key Patterns

Routing is centralized in `src/app/routing` and route constants live in `src/app/variables/rotas.ts`.

Authentication state lives in `src/app/providers/authProvider.tsx`. Server state should use TanStack Query. Avoid adding global client state unless a feature has a clear cross-screen need.

API services should be wrapped in feature-local `api/service.ts` files and exported through `api/index.ts`. Components and pages should not call Axios directly.

Forms use React Hook Form and Zod. Keep schemas close to the feature or form that owns them.

Use `notify` from `components/ui/toast/notify` for user feedback and `getApiErrorMessage()` for API failures.

## Naming

- Use `@/` absolute imports for cross-feature imports.
- Prefer named exports, arrow functions and `type` for new TypeScript shapes.
- Use `import type` for type-only imports.
- Keep comments concise and only where they clarify non-obvious behavior.

## Environment

```sh
VITE_API_URL
```

Environment files currently point to `http://localhost:8080` and should be changed per product/deployment.

## Design System

Design reference page: `src/features/public/design-system/page-design-system.tsx`
Live at `/design-system` — shows every component with code snippet and method of use.

### Tokens

Design tokens (colors, radius, shadows) live in `src/index.css` inside `@theme inline` and `:root`.
Cal.com inspired palette: `#111111` primary, `#ffffff` canvas, `#f5f5f5` cards, `#e5e7eb` borders.
Always use semantic CSS vars (`var(--primary)`, `var(--muted)`) — never raw hex in components.

### Typography

Typography classes are defined in `@layer components` in `src/index.css`.
Use the `<Typography>` component (`src/components/typography/typography.tsx`) instead of raw HTML.

```tsx
import { Typography } from "@/components/typography";

<Typography variant="display-lg">Título principal</Typography>
<Typography variant="body-md" className="text-muted-foreground">Descrição</Typography>
<Typography variant="title-sm" as="h3">Card title</Typography>
```

Available variants (mapped to CSS classes of the same name):

| Variant | Size / Weight | When to use |
|---|---|---|
| `display-xl` | 64px / 600 | Hero único acima da dobra |
| `display-lg` | 48px / 600 | Título de seção principal |
| `display-md` | 36px / 600 | Título de página interna |
| `display-sm` | 28px / 600 | Sub-seção ou card destaque |
| `title-lg` | 22px / 600 | Nome de plano, modal title |
| `title-md` | 18px / 600 | Card title, intro de seção |
| `title-sm` | 16px / 600 | Card title pequeno, label de lista |
| `body-md` | 16px / 400 | Texto corrido |
| `body-sm` | 14px / 400 | Texto secundário, rodapé |
| `caption` | 13px / 500 | Badge label, legenda |
| `button` | 14px / 600 | Botões (aplicado via CVA no Button) |
| `nav-link` | 14px / 500 | Itens de nav |
| `hero-title` | 64px / 600 | Hero com fonte display |
| `hero-description` | 18px / 400 | Parágrafo abaixo do hero |
| `section-label` | 12px / 600 uppercase | Rótulo de seção tipo "01 — COLOR PALETTE" |
| `section-heading` | 48px / 600 | Heading de seção longa |
| `section-intro` | 16px / 400 | Introdução de seção |
| `ui-header` | 13px / 600 | Cabeçalho de painel/card pequeno |
| `inline-link` | 500 underline | Link inline em prosa |

The `as` prop overrides the rendered element (default is semantic per variant):
```tsx
<Typography variant="title-sm" as="span">inline</Typography>
<Typography variant="body-md" as="div">wrapper</Typography>
```

### Component conventions

**Forms:** wrap every field in `<FieldWrapper label htmlFor description error>`. Never add raw `<label>` + `<p>` manually.

**File upload:** use `<FileUI.Input>` (exported as `FileUI` from `@/components`), not a raw `<input type="file">`.

**Form footer:** use `<FooterButton isSubmitting isCreateMode>` for create/edit page footers.

**Overlays decision tree:**
- Quick action list → `DropdownMenu`
- Right-click area → `ContextMenu`
- Short config with inputs → `Popover`
- Blocking decision → `Dialog`
- Adaptive (auto center/lateral) → `SmartOverlay`
- Mobile-friendly bottom sheet → `Drawer`
- Structured lateral panel (header + scroll body + footer) → `AppSheet`

**Feedback:**
- Temporary confirmation → `notify.success / .error / .warning / .info`
- Data load failure with retry → `ErrorState`
- Empty list/table (no data, not an error) → `EmptyState`
- Copy to clipboard → `<ClipBoard texto="..." />`

**Charts:** always wrap recharts inside `<ChartContainer config={chartConfig}>`. Define colors as `var(--primary)` / `var(--muted-foreground)` inside the config.

**Breadcrumb:** use `<BreadCrumbComponent />` for auto-generation from route. Use the primitives (`Breadcrumb`, `BreadcrumbList`, etc.) for manual composition.

## Build Notes

- `vite` is overridden to `rolldown-vite@7.2.5`.
- Tailwind v4 is configured through CSS.
- React 19 is used.
- Known issue: HMR loop on dev server due to non-component exports in some files (authProvider, button). Hard reload (`Ctrl+Shift+R`) on `http://localhost:5173` resolves a blank page.
