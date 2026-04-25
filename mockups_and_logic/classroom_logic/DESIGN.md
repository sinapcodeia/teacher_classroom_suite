---
name: Classroom Logic
colors:
  surface: '#f8f9ff'
  surface-dim: '#d1dbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dfe9fa'
  surface-container-highest: '#d9e3f4'
  on-surface: '#121c28'
  on-surface-variant: '#444653'
  inverse-surface: '#27313e'
  inverse-on-surface: '#eaf1ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#003758'
  on-tertiary: '#ffffff'
  tertiary-container: '#004f7b'
  on-tertiary-container: '#7ac2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#94ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#f8f9ff'
  on-background: '#121c28'
  surface-variant: '#d9e3f4'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin: 24px
  max_width: 1440px
---

## Brand & Style

This design system is built for the modern educator, prioritizing cognitive ease and reliability. The brand personality is **composed, supportive, and efficient**, designed to fade into the background so the teacher’s work can take center stage. 

The aesthetic follows a **Modern Corporate** style with a focus on functional minimalism. It utilizes ample white space to reduce "dashboard fatigue" and employs a clear visual hierarchy to guide users through complex data entry tasks. The emotional response is one of "quiet confidence"—the app feels stable and responsive, even when connectivity is intermittent. High contrast and generous touch targets ensure accessibility in fast-paced classroom environments.

## Colors

The palette is rooted in **Professional Blues** for stability and authority, and **Progressive Greens** to symbolize student growth and task completion.

- **Primary (Ink Blue):** Used for primary actions, navigation headers, and active states. It provides a serious, trustworthy foundation.
- **Secondary (Growth Green):** Used for success states, completion indicators, and "Add" actions. It represents momentum and positive reinforcement.
- **Connectivity States:** 
    - **Online:** A vibrant emerald green indicates a live connection.
    - **Offline:** A neutral slate gray signifies local-only storage.
    - **Syncing:** A bright azure blue, often paired with a subtle pulse or rotation animation, indicates data transmission.
- **Neutral:** A range of cool grays (from Slate to Zinc) is used for text, borders, and backgrounds to maintain a clean, high-contrast environment.

## Typography

The design system utilizes **Inter** for all interface elements. Inter was selected for its exceptional legibility at small sizes and its neutral, systematic character.

Large headlines are set with slightly tighter letter spacing for a modern, professional look. Body copy prioritizes line height to ensure long lists of student names or lesson plans remain readable. Data-heavy views (like gradebooks) utilize `body-sm` and `label-sm` to maximize information density without sacrificing clarity. All labels for form inputs use `label-md` to ensure they are distinct from user-entered data.

## Layout & Spacing

This design system employs a **Fluid Grid** with a 12-column structure for desktop and a single-column layout for mobile. 

The spacing rhythm is based on a **4px baseline grid**. Standardized increments (8px, 16px, 24px, 32px) are used to maintain vertical rhythm. 
- **Forms:** Use `md` (16px) spacing between related fields and `lg` (24px) between field groups.
- **Tables:** Use `sm` (8px) vertical padding for compact rows and `md` (16px) for standard rows.
- **Margins:** A minimum page margin of `margin` (24px) ensures content doesn't feel cramped against the screen edge, especially on tablets used in the classroom.

## Elevation & Depth

To maintain a clean, institutional feel, this design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** The primary app background is a very light gray (#F9FAFB).
- **Level 1 (Cards/Containers):** White surfaces with a subtle 1px border (#E5E7EB). This level is used for data tables and calendar grids.
- **Level 2 (Modals/Popovers):** White surfaces with a soft, diffused ambient shadow (10% opacity, 12px blur) to indicate temporary overlay.
- **Depth through Color:** Information hierarchy is reinforced through subtle background shifts (e.g., a slightly darker gray for table headers) rather than physical displacement.

## Shapes

The design system uses **Soft** shapes to balance professionalism with approachability. 

- **Components:** Standard buttons, input fields, and checkboxes use a `0.25rem` (4px) corner radius.
- **Containers:** Cards and data containers use `rounded-lg` (0.5rem / 8px) to create a distinct but subtle frame for content.
- **Status Pills:** Connectivity indicators and tags use a fully rounded "pill" shape to distinguish them from actionable buttons and input fields.

## Components

### Connectivity Indicators
A persistent "Sync Status" component must be visible in the global navigation.
- **Online:** Solid green dot + "Connected".
- **Offline:** Hollow gray circle + "Working Offline".
- **Syncing:** Rotating blue arrows + "Syncing...".

### Data Tables
Tables are the heart of student management. 
- Use sticky headers for long lists.
- Zebra striping (very faint gray) for row readability.
- Columns for "Attendance" or "Grades" should use centered inputs for rapid entry.

### Calendar Views
- **Monthly/Weekly:** Use a clean grid with Level 1 containers.
- **Events:** Use color-coded bars (Primary Blue for classes, Secondary Green for deadlines).
- **Interactivity:** Drag-and-drop support for rescheduling, with immediate optimistic UI updates for offline use.

### Offline-First Forms
- **Input Fields:** Large tap targets (min 44px height). 
- **States:** Highlight unsaved changes with a subtle side-border in `tertiary_color_hex` until the sync is confirmed.
- **Buttons:** Primary buttons should be solid Primary Blue; secondary buttons use the outline style.

### Feedback Toasts
Success messages for data saved locally should be distinct from "Sync Complete" notifications. Use a bottom-left placement to stay clear of primary navigation.