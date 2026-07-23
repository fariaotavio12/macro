# Design System Inspired by Duna

## 1. Visual Theme & Atmosphere

Duna's design system embodies a sophisticated, future-forward aesthetic grounded in minimalist clarity and natural beauty. The visual identity merges serene landscape photography with crisp typography and decisive black-and-blue accents, creating an atmosphere of trust, innovation, and professional rigor. The design celebrates negative space, allowing breathing room for information hierarchy while maintaining a premium, enterprise-ready sensibility. This balance of tranquility and intensity positions Duna as both approachable and authoritative—ideal for compliance-driven business platforms that demand both clarity and confidence.

**Key Characteristics:**

- Minimalist composition with generous whitespace
- High-contrast black typography paired with decisive electric blue accents
- Natural, atmospheric background imagery with soft gradient overlays
- Premium dark UI elements with refined edge definition
- Clear typographic hierarchy with generous line spacing
- Trustworthy, compliance-focused visual language
- Emphasis on calm professionalism over flashiness

## 2. Color Palette & Roles

### Primary

- **Electric Blue** (`#0000EE`): Primary call-to-action, interactive links, and active states. Draws attention and signals the platform's forward-thinking, AI-native identity.
- **Pure Black** (`#000000`): Primary text, headings, and dominant UI elements. Establishes authority and readability across the interface.

### Accent Colors

- **Deep Burgundy** (`#1B0624`): Secondary accent for depth and visual hierarchy; used in UI components and supporting elements.
- **Charcoal Black** (`#292421`): Dark neutral accent for backgrounds, cards, and layered surfaces; softer than pure black.

### Interactive

- **Link Blue** (`#0000EE`): All navigational links and interactive elements maintain the primary electric blue.
- **Ghost Button Text** (`#000000`): Secondary interactive elements use black on transparent or light backgrounds.

### Neutral Scale

- **White** (`#FFFFFF`): Primary background for content areas, cards, and light surfaces.
- **Off-White** (`F7F7F5`): Subtle background surfaces and secondary card backgrounds.
- **Light Gray** (`#EDECE7`): Borders, subtle dividers, and low-emphasis backgrounds.
- **Medium Gray** (`#898683`): Secondary text, captions, and disabled states.
- **Dark Gray** (`#999999`): Tertiary text and very subtle UI elements.

### Surface & Borders

- **Charcoal Background** (`#1A1816`): Deep background surface for dark mode or card overlays.
- **Darkest Surface** (`#17100D`, `#160F0C`): Extreme dark backgrounds for maximum contrast.
- **Transparent White** (`#FFF9`): Subtle overlay or frosted glass effects.

## 3. Typography Rules

### Font Family

**Primary:** GT America Regular, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif

**Secondary:** system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif

**Fallback Stack:** sans-serif

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display / H1 | GT America | 72px | 400 | 72px | 0px | Hero headlines, page titles |
| Heading / H2 | GT America | 44px | 400 | 48.4px | 0px | Section headlines |
| Subheading / H3 | GT America | 40px | 400 | 48px | 0px | Feature titles, card headings |
| Heading / H4 | GT America | 32px | 400 | 38.4px | 0px | Secondary section headers |
| Label / H5 | GT America | 22px | 400 | 26.4px | 0px | Small headings, metric labels |
| Body | GT America | 16px | 400 | 24px | 0px | Primary body text, descriptions |
| Small Body | sans-serif | 14px | 400 | 14px | 0px | Form input text, secondary descriptions |
| Link / Metadata | sans-serif | 12px | 400 | normal | 0px | Navigation links, captions, fine print |

### Principles

- All headings use GT America Regular at 400 weight for a clean, modern aesthetic
- Line height consistently exceeds font size for improved readability and premium spacing
- Body text (16px) paired with 24px line height creates 8px leading for visual rhythm
- Links maintain small 12px size for compact navigation while preserving touch targets via padding
- No letter-spacing adjustments; rely on GT America's native kerning for elegance

## 4. Component Stylings

### Buttons

**Primary Button**

- Background: `#0000EE`
- Text Color: `#FFFFFF`
- Font Size: 16px
- Font Weight: 400
- Padding: `12px 24px`
- Border Radius: `24px`
- Border: none
- Box Shadow: none
- Hover State: Background `#0000CC` (10% darker)
- Active State: Background `#0000AA` (20% darker)
- Disabled State: Background `#CCCCCC`, Text Color `#666666`, opacity 0.6

**Secondary Button**

- Background: `#FFFFFF`
- Text Color: `#000000`
- Font Size: 16px
- Font Weight: 400
- Padding: `12px 24px`
- Border Radius: `24px`
- Border: `1px solid #EDECE7`
- Box Shadow: none
- Hover State: Background `#F7F7F5`, Border `#CCCCCC`
- Active State: Background `#EDECE7`

**Ghost Button**

- Background: transparent
- Text Color: `#000000`
- Font Size: 12px
- Font Weight: 400
- Padding: `6px 20px`
- Border Radius: `24px`
- Border: none
- Box Shadow: none
- Hover State: Background `#F7F7F5`
- Active State: Background `#EDECE7`

**CTA Button (Primary Dark)**

- Background: `#000000`
- Text Color: `#FFFFFF`
- Font Size: 16px
- Font Weight: 400
- Padding: `16px 28px`
- Border Radius: `24px`
- Border: none
- Box Shadow: none
- Hover State: Background `#1A1816`
- Active State: Background `#292421`

### Cards & Containers

**Card Default**

- Background: `#FFFFFF`
- Border: `1px solid #EDECE7`
- Border Radius: `8px`
- Padding: `24px`
- Box Shadow: none
- Hover State: Border `#D0D0D0`, subtle lift via transform

**Card Dark**

- Background: `#1A1816`
- Border: `1px solid #292421`
- Border Radius: `8px`
- Padding: `24px`
- Box Shadow: none
- Text Color: `#FFFFFF`

**Container**

- Background: `#FFFFFF`
- Max Width: 1200px
- Padding: `0 20px`
- Margin: `0 auto`
- Border Radius: 0px

### Inputs & Forms

**Text Input**

- Background: `#FFFFFF`
- Text Color: `#000000`
- Font Size: 14px
- Font Weight: 400
- Line Height: 14px
- Padding: `12px 16px`
- Border Radius: `8px`
- Border: `1px solid #EDECE7`
- Box Shadow: none
- Focus State: Border `#0000EE`, Box Shadow `0 0 0 3px rgba(0, 0, 238, 0.1)`
- Placeholder Text: `#898683`

**Input Label**

- Font Size: 12px
- Font Weight: 400
- Text Color: `#000000`
- Margin Bottom: `8px`

**Form Group**

- Margin Bottom: `16px`
- Gap: `8px` (between label and input)

### Navigation

**Nav Link (Header)**

- Text Color: `#000000`
- Font Size: 14px
- Font Weight: 400
- Padding: `8px 12px`
- Border Radius: 0px
- Border Bottom: none
- Background: transparent
- Hover State: Text Color `#0000EE`
- Active State: Text Color `#0000EE`, Border Bottom `2px solid #0000EE`

**Nav Link (Small/Metadata)**

- Text Color: `#0000EE`
- Font Size: 12px
- Font Weight: 400
- Padding: `6px 12px`
- Border Radius: `24px`
- Border: none
- Background: transparent
- Hover State: Background `#F0F0FF`

### Badges

**Badge Default**

- Background: `#F7F7F5`
- Text Color: `#000000`
- Font Size: 12px
- Font Weight: 400
- Padding: `6px 12px`
- Border Radius: `16px`
- Border: `1px solid #EDECE7`

**Badge Accent**

- Background: `#0000EE`
- Text Color: `#FFFFFF`
- Font Size: 12px
- Font Weight: 400
- Padding: `6px 12px`
- Border Radius: `16px`
- Border: none

## 5. Layout Principles

### Spacing System

Base unit: **4px** — all spacing follows multiples of 4 for consistent rhythm.

**Spacing Scale:**

- `4px`: Minimal gaps, micro-spacing within components
- `8px`: Compact spacing between related elements
- `12px`: Small spacing, form field gaps
- `16px`: Standard spacing, component gutters
- `20px`: Medium padding, container padding
- `24px`: Component padding, section margins
- `32px`: Large spacing between component sections
- `40px`: Container padding, major section spacing
- `48px`: Large section gaps
- `64px`: Page section spacing
- `80px`: Major layout padding
- `96px`: Hero and top-level section padding

**Usage Context:**

- Typography: line-height and paragraph spacing follow 4px multiples
- Components: internal padding uses `12px`, `16px`, `24px`, or `40px`
- Sections: gaps between sections use `48px`, `64px`, or `96px`
- Cards: default padding `24px`; compact mode `16px`

### Grid & Container

**Max Width:** 1200px (primary content container)

**Padding:**

- Desktop: `80px` horizontal padding (symmetric)
- Tablet: `40px` horizontal padding
- Mobile: `20px` horizontal padding

**Column Strategy:**

- Desktop: 12-column grid at 1200px
- Tablet: 8-column grid at 768px
- Mobile: 4-column grid at 375px

**Section Patterns:**

- Full-width hero: extends to viewport edges with internal max-width container
- Card grid: uses `24px` gap between cards, responsive column count
- Hero + content: hero full-width, content sections constrained to max-width container

### Whitespace Philosophy

Duna's design prioritizes breathing room and visual hierarchy through aggressive whitespace. Large padding around hero sections (96px top/bottom) creates a sense of calm and importance. Between sections, 64px gaps provide clear visual separation without feeling claustrophobic. Typography benefits from 24px line-height, creating internal whitespace within text blocks. Cards and containers maintain generous 24px padding, ensuring content never feels cramped. This philosophy elevates the visual experience while maintaining focus on key messages.

### Border Radius Scale

- `0px`: Edges (full-bleed backgrounds, hero sections)
- `8px`: Form inputs, small cards, subtle UI elements
- `16px`: Badges, small buttons
- `24px`: Large buttons, prominent cards, major UI focal points
- `999px`: Pill-shaped elements, navigation badges, rounded indicators

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow, 1px border `#EDECE7` | Default cards, inputs, neutral surfaces |
| Raised (1) | `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08)` | Hover states on cards, subtle lift |
| Elevated (2) | `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12)` | Modal overlays, dropdown menus, prominent cards |
| Modal (3) | `box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16)` | Full-screen modals, high-priority dialogs |

**Shadow Philosophy:**

Duna employs minimal, refined shadows that respect the platform's premium aesthetic. Shadows use black with low opacity (`0.08–0.16`) rather than high-opacity offsets, creating subtle depth without drama. The approach reinforces the visual hierarchy: flat surfaces for secondary content, slight shadows for interactive elements, pronounced shadows only for critical modals. This restraint maintains the clean, trust-focused visual language while providing necessary spatial definition in complex UI arrangements.

## 7. Do's and Don'ts

### Do

- Use electric blue (`#0000EE`) as the sole accent color for all primary CTAs and interactive elements
- Maintain consistent padding of `24px` in cards and containers for premium feel
- Apply 24px line-height to all body text (16px) for readability and visual rhythm
- Use GT America Regular at weight 400 exclusively for headings and all typography
- Create generous whitespace: minimum `48px` between major sections, `96px` for hero padding
- Pair electric blue links with black text for maximum contrast and accessibility
- Use rounded corners (`24px` border-radius) for prominent, interactive components
- Employ `8px` border-radius for form inputs and secondary surfaces
- Respect the neutral scale for subtle UI hierarchy: light gray for borders, medium gray for secondary text
- Test all interactive elements at minimum `44px` height for touch accessibility

### Don't

- Mix multiple accent colors; electric blue is the sole primary accent
- Reduce line-height below 24px for body text; maintain breathing room
- Use bold or italic weights; GT America Regular at 400 is the only approved weight
- Apply shadows stronger than `0 12px 32px rgba(0, 0, 0, 0.16)` to maintain subtlety
- Crowd components; respect 16px minimum gutters, 24px preferred
- Use colors outside the defined palette; stick to black, white, gray, and electric blue
- Apply border-radius smaller than `8px` except for inline elements
- Create hover states without visual feedback (color, shadow, or background shift)
- Truncate text without ellipsis handling; always define line-clamp or overflow behavior
- Deploy non-system fonts; fallback to sans-serif if GT America is unavailable

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name | Width | Key Changes |
|-----------------|-------|-------------|
| Mobile | 375px–599px | Single-column layout, 20px horizontal padding, 40px section gaps, stacked cards, font sizes reduced by 4–8px where appropriate |
| Tablet | 600px–1023px | 2-column grid, 40px horizontal padding, 64px section gaps, larger padding in forms |
| Desktop | 1024px–1200px | 3+ column grid, 80px horizontal padding, 96px section gaps, full spacing scale |
| Large Desktop | 1200px+ | Max-width constraint `1200px`, centered container, full spacing and typography scale |

### Touch Targets

All interactive elements must meet minimum touch target size:

- Buttons: minimum `44px` height and width
- Links: minimum `36px` height with padding adjustments
- Form inputs: minimum `40px` height
- Navigation items: minimum `44px` height, `20px` horizontal padding
- Tap target spacing: minimum `8px` gap between adjacent touch targets

### Collapsing Strategy

**Mobile (375px–599px):**

- Single-column layout; card grids stack vertically with `16px` gap
- Hero section retains `40px` padding (reduced from 96px)
- Typography reduces: H1 becomes 48px, H2 becomes 32px, body remains 16px
- Navigation collapses to hamburger menu (not specified in tokens; use standard mobile nav pattern)
- Buttons expand to full width in forms with `12px` margin below each

**Tablet (600px–1023px):**

- 2-column grid with `24px` gap; 3-column grids reduce to 2-column
- Padding reduces from 96px to 64px for hero sections
- Typography remains full scale
- Navigation uses horizontal collapse at 8-item threshold

**Desktop (1024px+):**

- Full multi-column layouts (3+ columns)
- Maximum width constrained to `1200px`
- Full spacing scale applied
- All typography at default scale

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Electric Blue (`#0000EE`)
- **Primary Text / Headings:** Pure Black (`#000000`)
- **Background (Light):** White (`#FFFFFF`)
- **Background (Dark):** Charcoal (`#1A1816`)
- **Secondary Accent:** Deep Burgundy (`#1B0624`)
- **Border / Divider:** Light Gray (`#EDECE7`)
- **Secondary Text:** Medium Gray (`#898683`)
- **Disabled / Tertiary:** Dark Gray (`#999999`)

### Iteration Guide

1. **Always use GT America Regular, weight 400** for all typography; fallback to system sans-serif only if unavailable.

2. **Electric blue (`#0000EE`) is the sole accent color**; apply to all primary CTAs, active states, and primary links. Never mix with other accent colors.

3. **Body text (16px) must have 24px line-height** and paired with generous padding in containers (minimum 24px). Never reduce line-height below 24px.

4. **Whitespace is premium space**; apply minimum 48px gaps between sections, 96px for hero padding, 24px between components. Negative space enhances trust and clarity.

5. **Border-radius follows 4px multiples**: 8px for inputs/cards, 16px for badges, 24px for buttons/prominent elements, 0px for full-bleed surfaces.

6. **All interactive elements require hover, active, and focus states**. Minimum change: text color shift or background color change to establish interactivity.

7. **Shadows are subtle and rare**; use only `0 1px 3px rgba(0, 0, 0, 0.08)` for subtle lift, `0 4px 12px rgba(0, 0, 0, 0.12)` for modals. Never exceed this for modal elevation.

8. **Touch targets must be 44px minimum** (height and width); form inputs 40px, buttons 44px, links 36px with padding. Ensure 8px spacing between adjacent targets.

9. **Neutral scale provides hierarchy**: white for primary surfaces, light gray (`#F7F7F5`) for secondary surfaces, medium gray (`#898683`) for secondary text, dark gray for tertiary. Avoid pure black text on pure white; consider charcoal for dark mode.

10. **Responsive breakpoints** (375px mobile, 600px tablet, 1024px desktop, 1200px max): collapse grids from multi-column to 2-column, reduce hero padding from 96px to 40px on mobile, stack forms to single column, maintain 16px gutters on mobile.
