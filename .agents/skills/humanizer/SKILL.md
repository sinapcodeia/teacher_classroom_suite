---
name: humanizer
description: >-
  Humanized design, UX, and communication framework. Use this skill when developing UI/UX components, writing microcopy, designing user flows, or structuring system interactions to ensure a warm, natural, empathetic, and highly intuitive experience without robotic or generic patterns across all developments.
---

# Humanizer Framework: UI, UX & Communication Standards

## Purpose
The **Humanizer** framework ensures that all web applications, user interfaces, system feedback, and software architecture feel warm, natural, empathetic, and deeply human-centered. It eliminates cold technical jargon, robotic copy, artificial visual clutter, and frustrating UX patterns.

---

## 1. Humanized Tone of Voice & Copywriting (Spanish First)
- **Empathetic & Conversational**: Speak to users directly and warmly ("¡Todo listo!", "Te ayudamos a preparar tu clase", "Guardamos tus cambios de forma segura").
- **No Technical Jargon in UI**: Never expose raw system exceptions, database codes, or stack traces directly to end users.
  - *Bad:* `FirebaseError: PERMISSION_DENIED (0x800)`
  - *Humanized:* `"No tienes permisos para ver esta sección. Inicia sesión con una cuenta autorizada."`
- **Actionable & Encouraging Empty States**: Empty screens should never be cold or dead ends. Always include an encouraging graphic, clear guidance, and a quick action button.
  - *Example:* `"Aún no has registrado actividades para este periodo. ¡Crea la primera evaluación con un solo clic!"`

---

## 2. Human-Centric UI/UX Design Principles
- **Touch-Friendly & Tactile Feedback**:
  - Buttons must have a minimum hit target of `44x44px`.
  - Add active scaling effects (`active:scale-95 transition-all`) to provide tactile confirmation on touch devices.
- **Harmonious Visual Aesthetics**:
  - Avoid raw `#FF0000` or `#0000FF`. Use curated color palettes with accessible contrast (e.g. Tailwind `emerald-600`, `indigo-600`, soft zinc/slate neutrals).
  - Use subtle glassmorphism (`backdrop-blur-md bg-white/80 border border-white/20`) and soft elevation (`shadow-xl shadow-primary/10`).
- **Smooth & Purposeful Micro-Animations**:
  - Skeleton loaders (`animate-pulse`) during async data fetches instead of blank screens.
  - Smooth hover states (`hover:scale-[1.02] hover:-translate-y-0.5`).

---

## 3. Humanized Code & Resilient Engineering
- **Local Resilience (Zero Data Loss)**: Always save transient state locally (`localStorage` or IndexedDB draft backups) before sync operations so that network drops never cause data loss for the user.
- **Graceful Error Recovery**: If an operation fails, notify the user with a friendly toast and automatically provide a "Reintentar" (Retry) action.
- **Clear Intent**: Write clean, self-documenting code with meaningful variable names and zero mechanical magic numbers.

---

## 4. Checklist for New Developments
When building any new feature or module, verify:
- [ ] Is the language warm, clear, and in natural Spanish?
- [ ] Are empty states helpful, inviting, and equipped with a CTA?
- [ ] Are input validations instant, clear, and non-punitive?
- [ ] Is there visual feedback (spinner/skeleton/toast) for every user action?
- [ ] Is the interface responsive and optimized for tablets and mobile devices?
