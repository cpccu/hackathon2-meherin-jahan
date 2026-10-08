# CampusOS design system

## Direction

CampusOS uses warm paper surfaces and a confident burgundy identity. Public pages follow “A campus that comes alive”: an original illustrated campus invites exploration, while account pages prepare a decorative campus passport at a welcoming desk. The signed-in workspace prioritizes readable records, forms and actions.

The redesign covers landing, account creation, login, recovery, dashboard, resources, Helpdesk, events, lost/found, complaints, notices, courses, attendance, profile and administration. It keeps the existing React and Supabase architecture and adds no runtime dependencies.

## Foundations

Shared tokens live in `src/design.css`, imported after the existing stylesheets. Public compositions are isolated in `src/creative.css`; the replaced public rules were removed from `design.css`.

| Foundation | Choice |
| :--- | :--- |
| Canvas | Warm ivory `#f7f4ee` |
| Surface | Soft white `#fffefa` |
| Main text | Dark ink `#232e29` |
| Secondary text | `#626e65` |
| Brand | Burgundy `#852f40` |
| Supporting accent | Forest `#315b48` and sage `#e7eee4` |
| Typography | DM Sans for controls/body; Playfair Display for selected editorial headings |
| Depth | Fine borders, restrained shadows, layered surfaces |
| Icons | Shared inline SVGs in `CampusIcon.jsx` |

Keep accents meaningful: burgundy identifies primary actions, forest supports positive feedback, and muted surfaces distinguish secondary controls. Operational screens use readable sans-serif headings where records need to be scanned quickly.

## Layout and components

- **Landing:** original SVG terrain, buildings and greenery blend with existing campus photography. Four keyboard-operable destinations open native preview dialogs. Three short scrolling chapters change the focus of one campus scene. Bookshelf, conversation, ticket and calm support compositions give each module its own personality. Preview content is labelled and contains no invented records.
- **Accounts:** an optional paper passport opens beside immediately available forms. Role selection changes its accent/icon. Three signup steps validate details, credentials and review; input remains in memory when moving backward or switching login/signup. The passport shows only first name, department and requested role. It never shows passwords or issues an identity document. Staff approval and email-confirmation states describe actual access.
- **Recovery:** the same paper desk becomes a quiet envelope/key scene, preserving recovery requests and valid-session password updates.
- **Workspace:** fixed desktop navigation, a sticky header, a mobile drawer and bottom navigation. Smart Helpdesk remains immediately after Courses & Attendance in the main navigation.
- **Data screens:** readable filters, distinct selected states, structured lists/cards, useful empty states and clear retry controls.
- **Notices:** searchable announcements, topic filters, visible audience labels and existing image/PDF previews and downloads.
- **Profile:** actual account details, saved resources and useful academic/upload shortcuts.
- **Forms:** consistent touch targets, visible focus, validation feedback and retained input on failed saves.

## Motion

Use the shared easing and duration tokens. Page entrances, hover elevation, pressed controls and accordions should help explain state changes without delaying actions.

`usePointerDepth.js` gently moves decorative SVG/photo layers and the passport on desktop pointer movement. It requires a viewport of at least 900px, a fine pointer and no reduced-motion preference; data-saving and reported low-core devices skip it. Pointer listeners are passive and writes use `requestAnimationFrame`. Listeners, observers and frames are cleaned up when pages close. Text and controls remain stable, and scrolling stays native.

`prefers-reduced-motion` disables decorative transitions and parallax. Public and workspace headers stay at the top, fade after inactivity and return on pointer, keyboard, touch or scroll activity; focused controls remain visible. Landing section reveals use short opacity/transform transitions in both scroll directions without changing native scrolling; reduced-motion users get ordinary static content.

## Drafts and refresh

Shared action forms and resource uploads mark changed input as unsaved. Switching workspace modules or logging out offers Keep editing / Discard & leave. Reloading or closing the page uses the browser's unsaved-change warning. Successful saves clear the draft marker.

Data refresh retains mounted content and any form input while displaying a refresh status. Initial loading uses skeletons; an unsuccessful refresh keeps the last loaded content with a retry message. Course/session selection, support-tab switches and Helpdesk edit/cancel actions also warn about unfinished forms. Draft protection does not persist forms across browser crashes.

## Accessibility and responsive behavior

Use semantic headings, labelled controls, keyboard focus, skip links and comfortable touch targets. Role selectors and bookshelf tabs support arrow keys, Home and End. Destination previews use native dialog focus containment, close with Escape and restore focus to their trigger. The navigation drawer and unsaved-change dialog keep their existing focus behavior.

On phones, the form comes first and the passport becomes a compact supplementary preview. Name/email/password autocomplete attributes support browser autofill; actual password-manager autofill still requires manual browser review. Account drafts are held only in mounted React state, never local storage, and are cleared when leaving the account pages or refreshing.

Layouts adapt at phone, tablet and desktop widths. Phone form fields stay at least 16px to avoid input zoom. Tables and attachment viewers keep their own scrolling area where needed. Decorative motion must not be essential to understanding content.

## Data and permissions

The redesign preserves Supabase authentication, table writes, storage, ticket check-in, private complaints and attendance authorization. Signup requests do not grant staff access. Loading a selected role never bypasses the database-assigned role or row-level security.

Actual content still needs to be published by authorized campus staff. The redesign does not seed courses, attendance, schedules, notifications or AI responses.

## Verification

Run `npm run lint`, `npm test` and `npm run build`. Review desktop and narrow phone layouts, keyboard role selection, filters, attachment viewers, the mobile drawer, reduced motion and draft warnings. Use dedicated Student, Teacher and Admin accounts for database write and privacy acceptance checks; see [VERIFICATION.md](VERIFICATION.md).
