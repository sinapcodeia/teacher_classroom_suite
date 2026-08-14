---
name: impeccable
description: >-
  Impeccable design system and anti-AI-slop framework. Use this skill when designing frontend UI/UX, styling components, auditing visual aesthetics, or implementing dynamic animations to ensure ultra-premium, modern, non-generic, state-of-the-art designs.
---

# Impeccable Design & Anti-AI-Slop Framework

## Purpose
The **Impeccable** skill prevents "AI Slop"—the generic, uninspired, repetitive UI defaults (raw primary colors, plain white boxes, default browser fonts, boring static layouts) that AI models default to. It mandates high-end visual aesthetics, bespoke typography, subtle depth, dynamic animations, and state-of-the-art UX across all web developments.

---

## 1. Core Principles (Anti-AI-Slop Rules)

### 🎨 1. Bespoke Typography & Typography Scales
- **Never Browser Defaults**: Always import modern fonts (e.g. `Outfit`, `Inter`, `Plus Jakarta Sans`, `Roboto`).
- **Expressive Hierarchy**: Use strong contrast between font weights (`font-black`, `font-bold`, `tracking-widest`, `uppercase`) for headers, badges, and microcopy.

### 🌈 2. Tailored Color Systems & Gradients
- **No Raw Colors**: Avoid basic `#FF0000`, `#0000FF`, or default plain red/blue. Use curated, modern color palettes (e.g. HSL tailored tokens, soft emeralds, vibrant indigos, deep slate neutrals).
- **Vibrant & Glassmorphic Surfaces**: Use modern glass effects (`backdrop-blur-xl bg-white/80 border border-white/20`), smooth radial gradients, and dark mode harmony.

### ✨ 3. Living, Tactile Micro-Interactions
- **Interfaces Must Feel Alive**:
  - Hover states: `hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200`.
  - Active press states: `active:scale-95`.
  - Soft ambient shadows: `shadow-xl shadow-primary/20`.
- **Skeleton States**: Always show polished skeleton screens (`animate-pulse`) while waiting for data fetches instead of blank boxes.

### 🖼️ 4. Zero Generic Placeholders
- Never use dull placeholder text (`Lorem Ipsum`, `test`). Use real domain-specific data or generated visual assets.

---

## 2. Impeccable Audit & Execution Workflow

### 🛠️ `/impeccable craft`
Build brand-new components with bespoke styling, fluid responsiveness, and premium typography from line 1.

### 🪄 `/impeccable polish`
Audit existing components to elevate visual hierarchy, add micro-animations, tune shadows, and refine spacing.

### 🔍 `/impeccable audit`
Scan the UI for generic patterns, poor contrast, unstyled scrollbars, or broken layout boundaries.

---

## 3. Visual Checklist for Every Component
When crafting UI components, verify:
- [ ] Are typography scale and weights distinctive and expressive?
- [ ] Are colors harmonious, accessible, and free of raw primary defaults?
- [ ] Do interactive elements (buttons, inputs, cards) have tactile hover/active states?
- [ ] Is spacing (padding, margin, gap) consistent and proportional across breakpoints?
- [ ] Are dark/light mode surface container tokens properly assigned?
