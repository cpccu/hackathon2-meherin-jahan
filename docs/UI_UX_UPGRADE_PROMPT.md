# CampusOS — complete UI/UX upgrade prompt

Act as a senior product designer and frontend engineer. Redesign and implement the entire existing CampusOS application for City University. Read README.md and inspect the components before changing anything. Deliver the working redesign in this repository, not just a concept or mockup.

## Experience and visual direction

Make CampusOS feel like a polished, memorable campus product: calm, fluid, welcoming and exceptionally easy to use. The experience should feel “like butter melting smoothly”—responsive actions, seamless transitions and a coherent visual rhythm. Give it a distinct City University identity through campus photography, considered typography and thoughtful composition.

Create a cohesive design system with CSS tokens for color, spacing, typography, radius, shadows and motion. Use warm ivory backgrounds, deep burgundy as the primary brand accent, dark ink text and restrained forest/sage secondary accents. Use subtle blended gradients and image color grading to connect these tones. Verify readable contrast throughout. Keep gradients atmospheric and purposeful; avoid saturated rainbow backgrounds and excessive glass effects.

Use a refined display face for selected headings and an excellent readable sans serif for product content. Establish strong hierarchy, generous but practical spacing, crisp icons and comfortable text sizes. Give pages varied composition suited to their purpose instead of repeating identical card grids everywhere.

## Upgrade every page

- Landing: a compelling campus hero, layered photography, clear actions, graceful section transitions and attractive introductions to the four modules. Use subtle parallax on decorative image layers; keep text and controls stable.
- Login/signup/recovery: a beautiful, focused layout, clear Student/Teacher/Admin selection, useful validation and understandable staff approval guidance.
- Workspace: elegant desktop sidebar, excellent mobile navigation, visible active location and a refined sticky header. Preserve the idle fade/reappear behavior; focused controls must remain visible and usable.
- Dashboard: purposeful hierarchy, real recent notices, actual resource statistics and quick actions tailored to the account role. Use genuine empty states when records are absent.
- Resource Hub: outstanding search/filter layout, readable metadata, polished upload interactions and clear preview/download/bookmark actions.
- Smart Helpdesk: distinctive topic icons, easy search, beautifully spaced answers, visible official sources and attractive image/PDF attachments.
- Clubs & Events: editorial event cards, prominent dates/venues, intuitive filters, polished registration tickets and efficient staff attendee/check-in tools.
- Lost & Found: photo-led reports, clear location/date/status and simple reporting. Give private complaints a focused submission flow and understandable tracking timeline.
- Notices: excellent long-text readability, clear audience/source information and comfortable image/PDF viewing with obvious download controls.
- Courses & Attendance: clear course hierarchy, efficient teacher forms, readable student records and trustworthy attendance presentation.
- Profile/Admin: tidy identity and permission information, deliberate form grouping and efficient content management.

## Motion and interaction

Create one coordinated motion language. Use short, responsive hover/press/focus transitions and slightly slower page or section entrances with natural easing. Add subtle card elevation, selected-filter transitions, smooth accordion expansion, contextual loading skeletons and clear success feedback. Preserve focus and prevent layout jumps when data loads.

Use parallax and scroll reveals sparingly on the landing page; operational screens should prioritize speed and clarity. Keep native scrolling. Use transform/opacity animations where practical, clean up listeners and respect prefers-reduced-motion. Disable decorative parallax on constrained/mobile devices. Avoid scroll hijacking, cursor replacement, autoplay distractions and delays before users can act.

## Preserve the working application

Keep existing Supabase authentication, database records, storage policies, role checks, uploads/downloads, search, event registration/check-in, complaints, notices and attendance workflows working. Keep Smart Helpdesk immediately after Courses & Attendance in the main navigation. Never replace real records with hardcoded demo cards or invent campus schedules, notifications, metrics or AI features.

Retain the distinction between requested signup role and actual admin-assigned permissions. Keep private resources, complaints and attendance private. Prefer the existing React/CSS structure and a consistent SVG icon system; add dependencies only when they provide a clear benefit. If a backend change becomes necessary, supply a separate migration and explain why.

## Quality and delivery

Make the result excellent on small phones, tablets and wide desktop screens. Provide semantic markup, labelled controls, visible keyboard focus, usable touch targets, reduced-motion support and clear loading/empty/error/success states. Ensure buttons and icons represent working actions. Keep forms readable, protect unsaved input and avoid horizontal overflow or obstructing sticky elements.

Implement the redesign across all screens and shared components. Review it visually at mobile and desktop widths. Run lint, automated tests and the production build; fix regressions. Verify available authenticated flows and explicitly report anything that could not be checked. Update documentation for relevant changes and summarize the design decisions, files changed and verification results. Finish a consistent whole application rather than polishing only the homepage.
