# Product

## Register

product

## Users

Two roles share one platform, and design decisions weigh both equally:

- **Students** — early-career and recent graduates with theory but limited proof of real execution. Often intimidated by traditional hiring. They come to explore real-world challenge tasks, accept and complete them, and turn submissions into demonstrable proof of skill. Their context: building a portfolio, looking for a way to stand out beyond grades and a thin CV.
- **Employers** — hiring teams tired of filtering candidates on resumes and interviews alone. They post tasks tied to real needs, watch how students actually execute, and discover talent through evidence of practical ability. Their context: reviewing submissions, searching talent by skill, deciding who's worth a conversation.

The shared job-to-be-done: **make skill demonstration — not the resume — the center of entry-level hiring.**

## Product Purpose

Internify is a two-sided learning-to-hiring platform that closes the entry-level hiring gap. Employers post real challenge tasks; students explore, accept, and complete them; submissions become proof of ability instead of claims on paper. An AI track (submission grading, feedback, fairer assessment, the role-aware "Dalil" assistant) is being layered on to scale evaluation and fairness.

Success looks like: a student lands a real opportunity because their *work* spoke for them, and an employer hires with stronger evidence than any interview could give. The interface's job is to make proving and discovering skill feel direct, legible, and worth the effort — for both sides.

## Brand Personality

**Bold, confident, energetic.** Internify deliberately rejects the gray corporate job-board aesthetic in favor of a custom neobrutalist identity — high-contrast, opinionated, hard-edged (zero radius, solid black/white offset shadows, uppercase emphasis, rotated accents). It should feel like it has a point of view and stands behind it.

Confident, not loud-for-its-own-sake. The boldness has to carry credibility: students are putting real work on the line and employers are making real decisions, so personality serves trust rather than undercutting it. Voice is direct and plainspoken — say the thing, skip the corporate hedging.

## Anti-references

- **Generic job boards** (LinkedIn / Indeed / Wuzzuf) — gray corporate dashboards, dense soulless list views, enterprise-SaaS blandness. The whole reason Internify exists is to not be this.
- **Cluttered admin panels** — data-table overload, cramped toolbars, everything-on-one-screen. Density is not the same as capability.
- **Childish / gamified edtech** — cartoon mascots, confetti, badge-spam. Undercuts the credibility that proof-of-skill depends on. Energy comes from typographic and structural confidence, not toys.
- **Bland startup template** — the default shadcn look, interchangeable gradients, the Vercel-clone aesthetic with no identity. If it could be any startup, it's failed.

## Design Principles

1. **Proof over claims.** The work is the hero. Surfaces should foreground a student's actual submissions and an employer's actual tasks, not vanity metrics or self-described skills. Show, don't tell.
2. **Two sides, one spine.** Student and employer experiences are equal citizens built on shared infrastructure (auth, messaging, notifications, profiles). Role color and framing distinguish them; the underlying craft and component language stay consistent so neither side feels second-class.
3. **Confident, not loud.** Lean fully into the neobrutalist identity — but every bold move must earn its place by aiding legibility or hierarchy. Boldness that creates visual noise is failure, not personality.
4. **Legible under stakes.** People make consequential decisions here (accept this task, hire this person). High contrast, clear hierarchy, and unambiguous state (hiring status, availability, submission state) beat decoration every time.
5. **Distinctive by default.** If a screen could belong to any generic SaaS, rework it. The custom identity is the product's competitive signal, not a coat of paint.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**. The neobrutalist high-contrast style is an asset here, but hold the bar deliberately:

- Body text ≥4.5:1, large/bold text ≥3:1, placeholders held to the same 4.5:1 (no muted-gray-on-tinted-white).
- Full keyboard navigation and visible focus states on all interactive controls.
- Every animation needs a `prefers-reduced-motion` alternative (the floating-shape backdrops and drift animations already gate on it — keep that discipline).
- Role and status meaning must never rely on color alone (student/employer, hiring/not-hiring, availability) — pair with label, icon, or shape.
