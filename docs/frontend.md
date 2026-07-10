# Frontend Client Architecture & Theme System

This document outlines the React client architecture, components, and the theme-aware styling system.

## 1. Client Stack

The frontend is constructed using:
- **Build Engine:** Vite (offering fast Hot Module Replacement).
- **Core Library:** React 18.
- **Styling:** Vanilla CSS configured with CSS variables supporting multiple themes.
- **Routing:** React Router DOM.

---

## 2. Page & Layout Directory

- **`SupremeConsole.jsx`**: The command-center layout that integrates real-time agent execution telemetry logs, terminal output rendering, file diff visualization, and the human-in-the-loop approval prompt.
- **`Chat.jsx`**: Interactive chat interface for talking to the agent orchestrator.
- **`Memory.jsx`**: Lists system memories, knowledge points, and historical context nodes.
- **`Workspace.jsx`**: Codebase structural browser and file system tree representation.
- **`OperationalHub.jsx`**: Telemetry charts and health metrics check page.
- **`Terminal.jsx`**: An interactive terminal emulator for executing shell tasks directly.

---

## 3. Theme System

The design system is fully theme-aware, utilizing CSS custom properties declared inside `index.css`:

### Available Themes
- **Cyber-Neon (Default Dark):** High contrast neon green and deep black panels.
- **Amethyst (Dark):** Sleek deep violet and indigo layouts.
- **Aurora Polar (Dark):** Emerald green highlights with dark teal boards.
- **Space Slate (Dark):** Elegant dark charcoal aesthetics.
- **Nordic Light (Light):** Bright indigo and light gray themes.
- **Cyber Light (Light):** High-contrast rosy red and light background themes.

### Implementation Helpers
- `.glass-panel`: Applies standard CSS backdrop-blur rules for visual layers.
- Accented highlights, scrollbars, focus states, and select dropdowns automatically morph variables based on the active theme class attached to the root document.


### Style: Minimal Premium Visual System
The user interface uses a high-contrast white layout base. Accent styling changes colors based on the cobalt, lavender, or emerald themes.

### Routing: Component Structure Map
Routing is managed via react-router. Main app frames are wrapped in the `AuthLayout` for sign-in steps and `OperationalShell` for cognitive operations.

### Telemetry: Visual Metrics Dashboards
Telemetry displays metrics in dynamic cards mapping to throughput rates, response latency, memory occupancy, and active task queues.

### State: Zustand Stores Map
- `useOrchestrationStore`: Logs messages, stages, active workflows.
- `useTelemetryStore`: Logs real-time metrics.
- `useContextStore`: Manages hypothesis context.

### Motion: Micro-Animations Guidelines
All navigation button hovers, dropdown transitions, and slide-in drawers use framer-motion with smooth, subtle damping settings.

### Tailwinds: Color Palette Configurations
Custom colors mapped in configuration files: `primary` (blue-500), `surface` (slate-50), and `border` (slate-200) coordinates for minimal light-mode layouts.