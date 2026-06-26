---
name: Internify
description: A two-sided learning-to-hiring platform where students prove skill through real work and employers hire on evidence.
colors:
  ink: "#020817"
  paper: "#F8FAFC"
  card-white: "#FFFFFF"
  muted-ink: "#64748B"
  hairline: "#E2E8F0"
  structural-border: "#C9D1DC"
  primary-blue: "#2563EB"
  primary-blue-bright: "#3B82F6"
  secondary-violet: "#D243EF"
  badge-violet: "#AB47BC"
  alert-pink: "#FF0055"
  destructive-red: "#EF4444"
  hiring-green: "#A7F3D0"
  hiring-green-ink: "#047857"
  selective-amber: "#FCD34D"
  not-hiring-red: "#EA4335"
  role-employer: "#AB47BC"
  role-employer-deep: "#8E24AA"
  role-student: "#2563EB"
  dash-violet: "#6B26D9"
  dash-violet-bright: "#D58FE0"
  dash-emerald: "#0FA070"
  dash-emerald-bright: "#2DD99B"
  cat-design-pink: "#EC4899"
  cat-mobile-purple: "#CE93D8"
  pure-black: "#000000"
  pure-white: "#FFFFFF"
  dark-bg: "#020817"
  dark-card: "#0A0F1E"
typography:
  display:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.1em"
rounded:
  none: "0"
  hint: "0.375rem"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-blue}"
    textColor: "{colors.pure-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.primary-blue}"
    textColor: "{colors.pure-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "36px"
  button-destructive:
    backgroundColor: "{colors.destructive-red}"
    textColor: "{colors.pure-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "36px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "48px"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px"
  badge-default:
    backgroundColor: "{colors.primary-blue}"
    textColor: "{colors.pure-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 12px"
  badge-secondary:
    backgroundColor: "{colors.badge-violet}"
    textColor: "{colors.pure-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 12px"
---

# Design System: Internify

## 1. Overview

**Creative North Star: "The Proof Press"**

Internify reads like a letterpress for skill. Ink-black borders are stamped onto paper-white surfaces, and every interactive element casts a hard, blur-free shadow — the visual equivalent of type embossed into a page. There is no softness, no ambient glow, no gradient haze. Corners are square (0 radius, universally). Labels are set in black-weight uppercase with wide tracking, the way a printer sets a headline. The result is a system that feels manufactured and deliberate — a platform that *publishes* proof of ability rather than decorating claims about it.

The boldness is in service of credibility, not spectacle. People make consequential decisions here (a student stakes real work; an employer decides who's worth a conversation), so the hard contrast exists to make state and hierarchy unmissable, never to shout. This is neobrutalism dialed toward authority: confident, structural, plainspoken.

This system explicitly rejects the **bland startup template** (default shadcn, interchangeable gradients, the Vercel-clone look with no identity), the **generic gray job board** (LinkedIn/Indeed/Wuzzuf enterprise blandness), **cluttered admin density**, and any **childish or gamified** energy (mascots, confetti, badge-spam) that would undercut the seriousness of proof-of-skill. If a screen could belong to any anonymous SaaS, it has failed.

**Key Characteristics:**
- Square corners everywhere (0 radius) — sharp, deliberate, printed.
- Hard offset shadows with zero blur (`Npx Npx 0 0`), black in light mode, white in dark.
- Black/white borders signal *interactive*; gray borders signal *structural*.
- Black-weight (900) uppercase, wide-tracked labels for all controls and tags.
- Sora for headings, DM Sans for body — geometric authority over humanist warmth.
- Dual light/dark themes; the shadow color and border color invert, the structure does not.

## 2. Colors

A near-monochrome ink-on-paper foundation, charged by a small set of saturated, fully-committed signal colors. Color is never decorative here — it carries role, state, and identity.

### Primary
- **Press Blue** (#2563EB): The platform's primary action color and brand anchor. Fills primary buttons, default badges, and the bright focus-shadow on inputs in dark mode. In dark mode the primary brightens to **Beacon Blue** (#3B82F6) for legibility against near-black.

### Secondary
- **Signal Violet** (#D243EF): The secondary brand hue (`--secondary`, HSL 290 84% 60%), used for accent and brand-gradient endpoints. Its calmer applied cousin **Badge Violet** (#AB47BC) carries `secondary` badges and tags where full saturation would vibrate.

### Tertiary
- **Alert Pink** (#FF0055): A deliberately hot error/attention color — the error focus-shadow on inputs (`aria-invalid`) and destructive badges. Reserved for states that must not be missed.
- **Destructive Red** (#EF4444): Destructive *buttons* and dangerous actions (`--destructive`).

### Status (signal set — meaning is load-bearing, never color-only)
- **Hiring Green** (#A7F3D0 fill / #047857 ink): Employer is actively hiring; student is open for offers.
- **Selective Amber** (#FCD34D): Selective / partial availability.
- **Not-Hiring Red** (#EA4335 on white text): Closed to new applicants.

### Neutral
- **Ink** (#020817): Primary text and the canonical interactive border in light mode. Near-black, faintly blue.
- **Paper** (#F8FAFC): The light-mode body background and `outline` button fill — a true near-white at minimal chroma, *not* a warm cream.
- **Card White** (#FFFFFF): Raised card and popover surfaces in light mode.
- **Muted Ink** (#64748B): Secondary/supporting text. Hold it to ≥4.5:1; never lighter on tinted backgrounds.
- **Hairline** (#E2E8F0) / **Structural Border** (#C9D1DC): Gray dividers and the borders of non-interactive structural panels.
- Dark mode: **Dark BG** (#020817) body, **Dark Card** (~#0A0F1E) raised surfaces, borders and shadows flip to **Pure White** (#FFFFFF).

### Named Rules
**The Black-for-Interactive Rule.** A pure-black (light) or pure-white (dark) 2px border plus a hard offset shadow means *"you can act on this"* — buttons, inputs, clickable cards, tags. Structural, non-interactive panels (filter rails, section frames, dashboards) use gray borders (`#C9D1DC`, `border-border`, `border-zinc-*`) and no offset shadow. Never give a static container a black border-plus-shadow; it reads as a dead button.

**The Committed-Color Rule.** Signal colors are used at full saturation or not at all. There are no 10%-tint pastel washes of brand color. A color's presence always means something (action, brand, state) — if it doesn't carry meaning, it stays ink-and-paper.

### Dashboard Palette (role + category)

The signed-in dashboards carry an extended, **tokenized** palette (defined once in `globals.css`, not hard-coded across the dashboard CSS):

- **Role accents** — the one color that distinguishes the two dashboards: **Student = `role-student` (#2563EB blue)**, **Employer = `role-employer` (#AB47BC purple)**, with `role-employer-deep` (#8E24AA) for dark-mode hero fills. Referenced as `var(--role-employer)` etc.
- **Analytics / rubric accents** — `dash-violet` (#6B26D9) and its dark-mode lift `dash-violet-bright` (#D58FE0); `dash-emerald` (#0FA070) / `dash-emerald-bright` (#2DD99B) for success/completion.
- **Category tags** — a small color-coded set keyed by task domain: dev → `role-student` blue, data → blue, mobile → `cat-mobile-purple`, design → `cat-design-pink`, marketing → `selective-amber`, writing → `dash-emerald`. **Known overlap:** dev and data currently share the blue — a deliberate de-dupe (give data its own hue) is a pending design call, not drift.

**The Role-Accent Rule.** A dashboard's identity color is exactly one token (`--role-employer` / `--role-student`). Never hard-code `#ab47bc` / `#2563eb` in a dashboard rule — reference the token so the two roles stay a single edit apart.

## 3. Typography

**Display Font:** Sora (with ui-sans-serif, system-ui fallback) — all headings h1–h6.
**Body Font:** DM Sans (with ui-sans-serif, system-ui fallback) — body copy and UI text.

**Character:** Two sans-serifs paired on a contrast of *role*, not silhouette: Sora is a geometric, slightly technical display face that gives headings architectural authority; DM Sans is a low-contrast humanist workhorse that stays quietly readable underneath. The signature move is the **label voice** — black weight (900), uppercase, wide letter-spacing — applied to every button, badge, and field label, lending the whole UI its stamped, printed cadence.

### Hierarchy
- **Display** (Sora 800, clamp(2.25rem, 5vw, 3.75rem), 1.05): Page and hero headlines. Capped well under the 6rem ceiling; `text-wrap: balance`.
- **Headline** (Sora 700, 1.5rem, 1.15): Section headings, card titles (`CardTitle` → h3).
- **Title** (Sora 700, 1.125rem, 1.25): Sub-section and list-group headings.
- **Body** (DM Sans 400, 1rem, 1.6): Paragraph and descriptive text. Cap measure at 65–75ch; `text-wrap: pretty` on long prose.
- **Label** (DM Sans 900, 0.625rem, +0.1em tracking, UPPERCASE): Buttons, badges, field labels, tags, eyebrow microcopy.

### Named Rules
**The Stamped-Label Rule.** Interactive and categorical microtext is always black-weight, uppercase, wide-tracked. This is the system's accent — it does the work that color or italics would do elsewhere. Do not lowercase a button or set a badge in regular weight.

## 4. Elevation

This system has **no soft shadows**. Depth is conveyed by hard, blur-free offset blocks — a solid shadow cast as if by a single hard light — and by the inversion of border/shadow color between themes. There is no `box-shadow` with a blur radius anywhere in the vocabulary. Elevation is structural and tactile, not atmospheric: a raised element is one that can be pressed *into* its own shadow.

### Shadow Vocabulary
- **Stamp SM** (`box-shadow: 2px 2px 0 0 #000` / `#fff` dark): Badges, tags, small chips.
- **Stamp MD** (`box-shadow: 4px 4px 0 0 #000` / `#fff` dark): Buttons, inputs (on focus), most interactive controls.
- **Stamp LG** (`box-shadow: 8px 8px 0 0 #000` / `#fff` dark): Cards and primary raised containers.
- **Error Stamp** (`box-shadow: 4px 4px 0 0 #FF0055`): Invalid input focus.

### Named Rules
**The Press-to-Flatten Rule.** Interactive elements sit raised at rest and *translate into their own shadow* on interaction: `hover:translate-x-[2px] translate-y-[2px]` with `hover:shadow-none`, deepening on `active` (`translate 4px`). The element visibly gets pressed; the shadow is the negative space it moves into. Motion is transform-only and respects `prefers-reduced-motion`.

**The No-Blur Rule.** Every shadow is `... 0 0` — zero blur, zero spread-fade. If a shadow has a blur radius, it is off-system. Glow and ambient depth are forbidden.

## 5. Components

### Buttons
- **Shape:** Square (0 radius). 2px border, black (light) / white (dark).
- **Primary:** Press Blue (#2563EB) fill, white uppercase black-weight label, Stamp MD shadow. Height 36px (default), `h-10` lg / `h-8` sm.
- **Secondary:** Press Blue (#2563EB) fill — same family as primary, distinguished by placement, not hue.
- **Outline:** Paper fill, ink text, Stamp MD shadow; hover tints to neutral-100/900.
- **Destructive:** Destructive Red (#EF4444) fill, white label.
- **Ghost:** Transparent, no border, no shadow; hover is a faint black/white 5% wash. The only "quiet" button.
- **Hover / Active:** Press-to-Flatten — translate into the shadow, `shadow-none` on hover, deeper translate on active. All transform-based.

### Badges & Tags
- **Style:** Square, 2px black/white border, Stamp SM shadow, uppercase black-weight 10px label.
- **Variants:** default = Press Blue; secondary = Badge Violet (#AB47BC); destructive = Alert Pink (#FF0055); outline = white/black fill with ink text.
- **Status badges:** Hiring/availability use the Status signal set (green/amber/red) and always pair the color with a text label — never color alone.

### Cards / Containers
- **Corner Style:** Square (0 radius).
- **Background:** Card White (light) / Dark Card (dark).
- **Shadow Strategy:** Stamp LG (`8px 8px 0 0`) when the card is a raised, interactive surface (see Elevation).
- **Border:** 2px black/white *if interactive*; gray (`#C9D1DC` / `border-border`) if it's a structural frame. Apply the Black-for-Interactive Rule.
- **Internal Padding:** 24px (`p-6`); gap-6 between stacked regions.
- **Never nest cards.** A raised card inside a raised card is prohibited.

### Inputs / Fields
- **Style:** Square, 2px black/white border, transparent fill (dark: solid black), 48px tall (`h-12`), bold text, 16px horizontal padding.
- **Focus:** No ring. Casts Stamp MD (`4px 4px 0 0 #000`; dark: Press Blue #2563EB) — the field gets stamped on focus.
- **Error:** `aria-invalid` → Alert Pink border + Error Stamp (`4px 4px 0 0 #FF0055`).
- **Disabled:** 50% opacity, no pointer events.

### Navigation
- Role-aware dashboard nav (student / employer). Active state uses a filled/raised treatment; labels follow the Stamped-Label Rule (uppercase, black-weight). Distinguish role context by framing, not by abandoning the shared component language.

### Signature: The Status Signal
Hiring status (employer) and availability (student) render as a labeled, colored badge from the Status set, editable inline by clicking the badge. It is the clearest expression of "Legible under stakes": a single high-contrast chip that says, unambiguously and never by color alone, whether a door is open.

## 6. Do's and Don'ts

### Do:
- **Do** keep every corner square (0 radius). Sharpness is the brand.
- **Do** use hard offset shadows only (`Npx Npx 0 0`), black in light / white in dark. 2px=badges, 4px=controls, 8px=cards.
- **Do** reserve black/white borders + offset shadows for *interactive* elements; give structural panels gray borders (`#C9D1DC`, `border-border`) and no shadow.
- **Do** set all labels, buttons, and badges in black-weight (900) uppercase with wide tracking.
- **Do** use signal colors at full saturation, and only when they carry meaning (action, brand, state).
- **Do** pair every status color with a text label or icon — meaning never rides on hue alone (WCAG 2.1 AA).
- **Do** keep body text ≥4.5:1; bump Muted Ink (#64748B) toward ink before it gets too light on tinted surfaces.
- **Do** drive interaction with the Press-to-Flatten transform, and gate every animation on `prefers-reduced-motion`.

### Don't:
- **Don't** ship the **bland startup template** — default shadcn radii, soft gradients, the interchangeable Vercel-clone look. If it could be any SaaS, rework it.
- **Don't** drift toward the **generic gray job board** (LinkedIn/Indeed/Wuzzuf) — soulless enterprise dashboards are the exact thing Internify exists to replace.
- **Don't** add **cluttered admin density** — data-table overload and cramped toolbars. Density is not capability.
- **Don't** introduce **childish or gamified** decoration — mascots, confetti, badge-spam. It undercuts proof-of-skill credibility.
- **Don't** use any shadow with a blur radius, a glow, or a gradient haze. Blur is off-system.
- **Don't** round corners, lowercase a control label, or set a badge in regular weight.
- **Don't** give a static, non-interactive container a black border + offset shadow — it will read as a broken button.
- **Don't** wash brand color into 10% pastel tints, and never nest a raised card inside another raised card.
