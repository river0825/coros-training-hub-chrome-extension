
# COROS Training Hub Extension - Style Guide

This document outlines the visual style guide for the Chrome Extension, derived from the styles of `t.coros.com` to ensure a consistent and native user experience.

---

## 1. Color Palette

The theme is dark, modern, and functional. Colors are used to create hierarchy and draw attention to key actions.

| Role                  | Hex/RGBA Value                  | CSS Variable                  | Usage                                           |
| --------------------- | ------------------------------- | ----------------------------- | ----------------------------------------------- |
| **Primary Background**  | `#0f1528`                       | `--c-background-primary`      | Main background color for the popup body.       |
| **Card Background**     | `#181e30`                       | `--c-background-card`         | Background for content containers (cards).      |
| **Inset Background**    | `#161b2b`                       | `--c-background-inset`        | Background for inset areas like headers.        |
| **Primary Accent**      | `#00b3ff`                       | `--c-accent-primary`          | Links, primary buttons, active states, icons.   |
| **Secondary Accent**    | `#f8283b`                       | `--c-accent-secondary`        | Warnings, delete actions, or special highlights.|
| **Primary Text**        | `#ffffff`                       | `--c-text-primary`            | Main text, titles.                              |
| **Secondary Text**      | `rgba(255, 255, 255, 0.6)`      | `--c-text-secondary`          | Subtitles, descriptions, less important info.   |
| **Muted Text**          | `rgba(255, 255, 255, 0.4)`      | `--c-text-muted`              | Helper text, disabled states.                   |
| **Primary Border**      | `rgba(255, 255, 255, 0.1)`      | `--c-border-primary`          | Main borders for separating sections.           |
| **Secondary Border**    | `rgba(255, 255, 255, 0.05)`     | `--c-border-secondary`        | Subtle borders for list items or table rows.    |

---

## 2. Typography

- **Font Family**: `Inter`, with system fonts as fallbacks.
- **Base Font Size**: `14px`
- **Base Line Height**: `1.5`

### Headings

- **H1 (`<h2>` in popup)**: `20px`, `font-weight: 500` - For main page titles.
- **H2 (`<h3>` in popup)**: `18px`, `font-weight: 500` - For card titles or section headers.
- **H3 (`<h4>` in popup)**: `16px`, `font-weight: 500` - For smaller sub-sections.

### Links

Links should use the `Primary Accent` color (`--c-accent-primary`). On hover, the color should lighten slightly.

---

## 3. Sizing and Spacing

- **Base Spacing Unit**: `4px`. All margins, padding, and layout gaps should be multiples of this unit.
- **Border Radius**: 
    - Small: `2px` (`--border-radius-sm`)
    - Medium: `4px` (`--border-radius-md`)

---

## 4. Components

### Buttons

- **Primary Button** (`.btn .btn-primary`):
  - **Background**: `var(--c-accent-primary)`
  - **Use Case**: The main call-to-action.

- **Secondary Button** (`.btn .btn-secondary`):
  - **Background**: `#2e3754`
  - **Border**: `1px solid var(--c-border-primary)`
  - **Use Case**: Secondary actions, like 'Cancel' or 'View Details'.

### Cards

- **Class**: `.card`
- **Appearance**: A container with a `var(--c-background-card)` background, `var(--border-radius-md)` corners, and a subtle `1px solid var(--c-border-secondary)` border.
- **Usage**: To group related information, such as a monthly summary or a list of activities.

### Lists

- **Activity List** (`.activity-list`):
  - **Item Separator**: `1px solid var(--c-border-secondary)`
  - **Spacing**: Items should have vertical padding of `12px` (`--spacing-unit * 3`).

---

## 5. Icons

`t.coros.com` uses a custom icon font (`iconfont`) for its iconography. For better performance, scalability, and easier management within a Chrome Extension, we recommend using **SVG icons**.

### Recommended Library

A library like **Lucide** ([lucide.dev](https://lucide.dev/)) is highly recommended as its style (clean, modern, line-based) is very similar to the icons used on the COROS website.

### Implementation

- **Format**: Use inline SVG for easy styling with CSS.
- **Color**: Icons should typically use `var(--c-text-secondary)`. For interactive elements, they can adopt `var(--c-accent-primary)` on hover or in an active state.
- **Size**: A base size of `16px` or `18px` is recommended for icons within text or buttons.

### Example

```html
<!-- Example of a "Download" icon next to a button text -->
<button class="btn btn-primary">
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="icon"
    >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
    <span>Export</span>
</button>
```

```css
/* Basic styling for an inline SVG icon */
.icon {
    display: inline-block;
    vertical-align: middle;
    margin-right: calc(var(--spacing-unit) * 2);
}
```

---

## 6. Usage Example

To apply these styles, you can use the provided `styles.css` file which will contain utility classes and component styles based on this guide.

```html
<div class="container">
    <div class="card">
        <div class="card-header">
            <h2>Monthly Summary</h2>
        </div>
        <ul class="activity-list">
            <li class="activity-item">
                <div class="activity-details">
                    <!-- Icon would go here -->
                    <div>
                        <div class="activity-title">Morning Run</div>
                        <div class="activity-date text-secondary">June 28, 2025</div>
                    </div>
                </div>
                <div class="activity-stats">
                    <span>10.2 km</span>
                    <span class="text-muted">55:12</span>
                </div>
            </li>
        </ul>
    </div>
    <button class="btn btn-primary">Export Data</button>
</div>
```
