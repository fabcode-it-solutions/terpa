# UI Components and Styling in Terpa Web

This document details the approach to UI development in Terpa Web, focusing on the styling strategy and the use of component libraries.

## 1. Overview

Terpa Web's frontend is built with React and Next.js, employing a modern stack for creating user interfaces. The styling is primarily driven by Tailwind CSS, and the component architecture leverages Radix UI and likely Shadcn/UI for building accessible and consistent UI elements.

## 2. Styling Strategy

- **Tailwind CSS**:
  - **Primary Styling Engine**: Tailwind CSS is a utility-first CSS framework used for rapidly building custom user interfaces. Instead of writing custom CSS classes, developers compose styles by applying pre-existing utility classes directly in the HTML/JSX.
  - **Configuration**: The `tailwind.config.ts` file defines the project's Tailwind configuration, including customizations to the default theme (colors, spacing, fonts), plugins, and content paths for JIT (Just-In-Time) compilation.
  - **Global Styles**: Base styles and global CSS are defined in `app/globals.css`.
  - **PostCSS**: `postcss.config.mjs` indicates the use of PostCSS, which Tailwind CSS uses under the hood for processing and optimizing CSS.
- **Class Name Management**:
  - **`clsx`**: A utility for constructing `className` strings conditionally. It's useful for applying classes based on component state or props.
  - **`tailwind-merge`**: A utility to intelligently merge Tailwind CSS classes in JavaScript without style conflicts. This is particularly helpful when creating component variants or overriding default styles passed as props.
- **CSS Animations**:
  - `tailwindcss-animate` is listed as a dependency, suggesting it's used to enable and manage CSS animations within the Tailwind CSS ecosystem.

## 3. UI Component Architecture

- **Component Libraries**:
  - **Radix UI (`@radix-ui/react-*` dependencies)**:
    - Provides a set of unstyled, accessible, and highly customizable UI primitives (e.g., Dialog, DropdownMenu, Tooltip, Checkbox).
    - Developers use these primitives as building blocks for more complex, application-specific components, ensuring accessibility best practices are followed.
  - **Shadcn/UI**:
    - Confirmed to be in use, alongside Tailwind CSS (version 3).
    - The presence of `components.json` and the common practice of using Radix UI with a tool like Shadcn/UI strongly suggests its use.
    - Shadcn/UI is not a traditional component library but a collection of reusable components built using Radix UI and Tailwind CSS. Developers typically copy-paste or use a CLI to add these components directly into their project (`components/ui/`), allowing full control over their code and styling.
    - The `components/ui/` directory likely houses these base components (e.g., Button, Card, Input, Select).
- **Application-Specific Components (`components/`)**:
  - **Organization**: The main `components/` directory is further organized by feature or domain (e.g., `components/machine/`, `components/billing/`, `components/admin/`). This promotes modularity and makes it easier to locate components related to specific parts of the application.
  - **Shared Components**: General-purpose components used across multiple features (e.g., `search-box.tsx`, `timestamp.tsx`, `clear-filters-button.tsx`) are placed at the root of `components/` or in a shared subdirectory.
  - **Tab Navigation**: A notable example of a feature-specific component is `components/team/manage-tabs.tsx`. This client component (`"use client"`) is responsible for rendering the tab navigation in the admin team management section. It uses the `usePathname` and `useParams` hooks to determine the active tab and constructs the appropriate links, demonstrating how client-side interactivity is integrated with the Next.js App Router for navigation.
- **Component Design Principles**:
  - **Reusability**: Components are designed to be reusable across different parts of the application.
  - **Composition**: Complex UI is built by composing simpler components.
  - **Accessibility (A11y)**: Leveraging Radix UI helps ensure components are accessible by default.
  - **Developer Experience**: Using Tailwind CSS and well-structured components aims for an efficient development workflow.

## 4. Key UI Directories and Files

- **`app/globals.css`**: Contains global styles, Tailwind CSS base directives (`@tailwind base; @tailwind components; @tailwind utilities;`), and potentially custom global CSS rules.
- **`tailwind.config.ts`**: Configures Tailwind CSS, including theme customizations (colors, fonts, spacing), plugins, and content paths.
- **`components.json`**: Configuration file for Shadcn/UI, specifying settings like the UI library path, styling choices, and component aliases.
- **`components/ui/`**: Likely contains the base UI components sourced from or inspired by Shadcn/UI, built upon Radix UI primitives and styled with Tailwind CSS. These are the fundamental building blocks for more complex application components.
- **`components/[feature]/`**: Directories like `components/machine/`, `components/inventory/`, etc., contain components specific to those features, often composing elements from `components/ui/`.

## 5. Workflow for Creating UI

1.  **Identify Need**: Determine if a new UI element or a variation of an existing one is required.
2.  **Check `components/ui/`**: See if a suitable base component (e.g., Button, Dialog, Input) from Shadcn/UI (via Radix) already exists.
3.  **Utilize or Customize**:
    - If a base component exists, use it directly.
    - If customization is needed, it can often be done via props or by applying additional Tailwind classes.
4.  **Create Feature-Specific Component**: If the UI element is complex or specific to a feature, create a new component in the relevant `components/[feature]/` directory, composing base UI components and adding feature-specific logic and styling.
5.  **Styling**: Apply styles using Tailwind CSS utility classes directly in the JSX. Use `clsx` for conditional classes and `tailwind-merge` to handle class conflicts when composing components.
6.  **Accessibility**: Rely on the accessibility features provided by Radix UI primitives. Test with keyboard navigation and screen readers where appropriate.

This approach to UI development and styling in Terpa Web aims for a balance of rapid development, consistency, customizability, and accessibility.
