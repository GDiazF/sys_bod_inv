# Componentes UI (`src/components/ui/`)

Primitivos del design system BodegaX. Estilos en `src/styles/primitives.css` (clases `bx-*`).

## Catálogo visual

http://localhost:5173/dev/components

## Componentes

| Componente | Variantes / estados |
|------------|---------------------|
| **Button** | `primary`, `secondary`, `ghost`, `danger`, `sm`, `loading`, `disabled` |
| **Badge** | `success`, `warn`, `danger`, `neutral`, `info` |
| **Label** | `required`, `hint`, `error` |
| **Input** | `fieldState`: `default`, `error`, `success`; `disabled` |
| **Select** | igual que Input |
| **Textarea** | igual que Input |
| **Alert** | `success`, `warn`, `danger`, `info` + `title` |
| **Panel** | `default`, `inset`, `accent`; `PanelHeader`, `PanelTitle` (`zone`), `PanelBody` (`scroll`) |
| **LoadingState** | spinner + label |
| **EmptyState** | icon, title, description, action |
| **ErrorState** | icon, title, description, retry |

## Uso

```tsx
import { Button, Panel, PanelHeader, PanelTitle, PanelBody } from '@/components/ui'
```

## Reglas

- No hardcodear colores/espaciado en componentes; usar clases `bx-*` o utilidades Tailwind mapeadas a `var(--*)`.
- No modificar `tokens.css` desde componentes.
- Accesibilidad: `aria-busy`, `aria-invalid`, `role="alert"` / `role="status"` donde aplica.
