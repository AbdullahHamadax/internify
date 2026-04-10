<div align="center">

<img src="logo-banner-svg" alt="Internify Logo" width="80" />

# Internify

**A two-sided learning-to-hiring platform, built as a graduation project.**

Connecting students with employers through real-world challenge tasks, giving students a way to prove their skills and giving employers a smarter way to discover talent beyond CV screening alone.

[![Live Site](https://img.shields.io/badge/Live%20Site-internify--one.vercel.app-black?style=for-the-badge&logo=vercel)](https://internify-one.vercel.app/)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge)

</div>

---

## The Problem

> Entry-level hiring is broken on both sides.

- 🎓 Students graduate with theory but limited proof of real execution.
- 🏢 Employers spend time filtering candidates without enough evidence of practical ability.
- 🔁 The result: guesswork for companies and frustration for students.

**Internify closes that gap by making skill demonstration the center of the experience.**

Instead of relying on grades, resumes, or interviews alone:

- Employers post tasks based on real needs.
- Students explore, accept, and complete those tasks.
- Submissions become proof of ability and not just claims on paper.

---

## Features

<details>
<summary><strong>🌐 Public Platform</strong></summary>

- Landing page with role-based onboarding for students and employers
- About page explaining the motivation, problem, and vision
- Auth flow with multi-step signup, login, forgot-password, and profile completion
- Role-aware AI assistant, **Dalil**, available across the platform

</details>

<details>
<summary><strong>🎓 Student Experience</strong></summary>

- Dashboard with overview, explore, messages, notifications, profile, and settings
- Explore tasks with real backend data, filtering, sorting, and task detail views
- Task acceptance flow with applicant limits
- Submission flow for accepted tasks
- Profile and portfolio-oriented student presentation

</details>

<details>
<summary><strong>🏢 Employer Experience</strong></summary>

- Dashboard with analytics, task management, messages, notifications, profile, and settings
- Task posting and editing flow
- Applicant tracking and submission visibility
- Talent search for browsing student profiles and skills

</details>

<details>
<summary><strong>⚙️ Platform Systems</strong></summary>

- Clerk authentication integrated with Convex user persistence
- Real-time messaging and notifications
- Role-aware navigation and dashboard routing
- File upload support for tasks and submissions
- Retrieval-assisted chatbot pipeline using Groq, Pinecone, and Hugging Face

</details>

---

## 🤖 AI Roadmap

AI is the next major track of Internify. This phase is intentionally presented as **in progress** and the team is actively building the full evaluation pipeline.

| Feature | Status |
|---|---|
| Automated submission grading | 🔄 In Progress |
| Code and solution evaluation | 🔄 In Progress |
| Feedback generation for students | 🔄 In Progress |
| Fairer skill assessment for employers | 🔄 In Progress |
| Stronger retrieval & assistant quality | 🔄 In Progress |
| AI CV generator and analyzer | 🔄 Planned |
| AI recommendation system | 🔄 Planned |
| Certificate generation | 🔄 Planned |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js, React, TypeScript |
| **Styling / UI** | Tailwind CSS v4, Radix UI, Lucide Icons |
| **Auth** | Clerk |
| **Backend / Database** | Convex |
| **AI / Retrieval** | Groq (`llama-3.3-70b-versatile`), Pinecone, Hugging Face (`sentence-transformers/all-MiniLM-L6-v2`) |
| **Validation / Forms** | Zod, React Hook Form |

---

## 🎨 Design

Internify uses a custom **brutalist / neobrutalist** visual system built on top of Tailwind CSS, Radix UI primitives, and project-specific components.

Visual inspiration draws from **shadcn/ui** patterns for composable UI foundations and **[neobrutalism.dev](https://www.neobrutalism.dev/)** for bold, high-contrast styling direction.

> [!IMPORTANT]
> The project does **not** directly depend on neobrutalism.dev as a packaged UI framework. The current interface is a fully custom implementation tailored to Internify's brand, role colors, and interaction patterns.

---

## 📁 Project Structure

```text
internify/
├── src/
│   ├── app/
│   │   ├── (auth)/                     # Login, signup, forgot-password, complete-profile
│   │   │   ├── complete-profile/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── sso-callback/
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   ├── about/page.tsx              # About / story page
│   │   ├── api/
│   │   │   ├── chat/route.ts           # Chat assistant endpoint
│   │   │   └── seed/route.ts           # Seed/testing helpers
│   │   ├── dashboard/page.tsx          # Role-aware signed-in dashboard entry
│   │   ├── globals.css                 # Global styles
│   │   ├── layout.tsx                  # Root app layout
│   │   ├── not-found.tsx               # 404 page
│   │   └── page.tsx                    # Landing page
│   ├── components/
│   │   ├── about/                      # About page visuals
│   │   ├── auth/                       # Auth-specific presentation components
│   │   ├── employer/                   # Employer dashboard, task management, analytics
│   │   │   └── talent-search/
│   │   │       └── TalentSearch.tsx    # Employer talent search filters and results
│   │   ├── home/                       # Signed-in home controls
│   │   ├── landing/                    # Landing page sections and marketing UI
│   │   ├── providers/                  # App providers (Convex client, etc.)
│   │   ├── shared/                     # Messages, notifications, settings, profile modals
│   │   ├── student/                    # Student dashboard, explore, profile, submissions
│   │   ├── ui/                         # Reusable UI primitives and wrappers
│   │   ├── Chatbot.tsx                 # Role-aware Dalil assistant shell
│   │   ├── SignedInView.tsx            # Signed-in landing/home wrapper
│   │   ├── Stepper.tsx                 # Shared multi-step progress UI
│   │   └── ThemeToggle.tsx             # Theme switching control
│   └── lib/
│       ├── convexAuth.ts               # Auth helpers bridging Clerk and Convex
│       ├── profileLinks.ts             # GitHub / LinkedIn URL helpers
│       ├── skillCatalog.ts             # Skill definitions and metadata
│       ├── skillMatching.ts            # Skill matching utilities
│       └── utils.ts                    # Shared utility helpers
├── convex/
│   ├── _generated/                     # Convex generated API/types
│   ├── auth.config.ts                  # Convex auth integration config
│   ├── convex.config.ts                # Convex project config
│   ├── messages.ts                     # Real-time messaging logic
│   ├── nameLimits.ts                   # Name validation rules
│   ├── notifications.ts                # Notification logic
│   ├── presence.ts                     # Typing / online presence handling
│   ├── schema.ts                       # Database schema
│   ├── tasks.ts                        # Task posting, acceptance, submissions, cleanup
│   └── users.ts                        # User creation / profile logic
├── public/                             # Static assets and branding files
├── testsprite_tests/                   # End-to-end / tooling test assets
├── next.config.ts                      # Next.js config
├── package.json                        # Scripts and dependencies
└── README.md                           # Project documentation
```

The product is organized around two main application surfaces — the **student side** (task discovery, acceptance, submission, communication, and profile building) and the **employer side** (task posting, talent search, candidate communication, and submission review) — both supported by shared infrastructure for auth, notifications, messaging, file handling, and AI.

---

## 👥 Team

### Tech Leads
| Name | GitHub |
|---|---|
| Abdallah Hamada | [@AbdullahHamadax](https://github.com/AbdullahHamadax) |
| Selim Waleed | [@Sarremo2002](https://github.com/Sarremo2002)|

### Full Team
1. Abdallah Mohamed Hamada
2. Selim Waleed Mohamed
3. Abdallah Ahmed Mousa
4. Ahmed Hisham Ahmed
5. Youssef Tarek Abdelmalak
---

## 📋 Contribution Highlights

<details>
<summary><strong>Abdallah Hamada</strong>: Platform foundation, frontend architecture, UI/UX polish</summary>

- Set up the initial project structure, global styles, landing page foundation, and early authentication architecture
- Integrated Clerk with Convex and built the multi-step signup, login, profile-completion, OAuth redirect, password-validation UX, and auth-guard improvements
- Led major frontend work for the employer-facing experience, including task management UI, analytics, employer profile/settings, task-detail polish, and talent-search frontend
- Shaped the platform's visual direction through typography migration, repeated UI redesigns, landing page refinement, about page redesign, LogoLoop improvements, and consistent brutalist-style polish
- Implemented and refined shared product systems such as notifications UX, typing and online indicators, message readability improvements, student settings/profile polish, accessibility cleanup, and responsiveness fixes
- Handled later structural fixes including landing/dashboard route separation, dashboard tab-routing cleanup, signed-in navigation fixes, chatbot presentation polish, and expired-task cleanup support

</details>

<details>
<summary><strong>Selim Waleed</strong>: Backend-connected product logic, role-based application flows</summary>

- Implemented auth and form-related fixes including unauthorized-access handling, password reset logic, input behavior fixes, captcha cleanup, and signup/login UX improvements
- Built the first real student dashboard flow, connecting explore tasks to backend data, improving filters, and replacing placeholder content with real task information
- Implemented core student workflow logic including task acceptance, applicant limits, and submission handling
- Implemented employer dashboard functionality for task creation, listing, and statistics
- Built talent-search functionality including student data retrieval and employer-facing search support
- Implemented real messaging logic for both employer and student experiences and polished message-related UI consistency
- Contributed to the AI-assistant effort through the dynamic role-aware Dalil integration

</details>

<details>
<summary><strong>Youseff Tarek</strong>: AI evaluation pipeline (planned)</summary>

- AI evaluation pipeline
- Submission analysis and grading research
- Intelligent scoring and feedback logic
- Certificate generation

</details>

<details>
<summary><strong>Ahmed Hisham</strong>: AI experimentation (planned)</summary>

- AI experimentation and model workflow design
- Evaluation quality improvements
- Assistant and grading system support
- AI CV generator and analyzer

</details>

<details>
<summary><strong>Abdallah Mousa</strong>: Updated Auth integration + AI infrastructure (planned)</summary>

- Contributed to updating Convex and Clerk's authentication and integration
- AI implementation support
- Evaluation pipeline integration
- Infrastructure support for the AI stage
- AI recommendation system

</details>

---

## 🚀 Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
NEXT_PUBLIC_CONVEX_URL=
CLERK_JWT_ISSUER_DOMAIN=
CLERK_FRONTEND_API_URL=
GROQ_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=
HF_TOKEN=
```

You will also need the standard Clerk application keys for local development.

### 3. Run Convex

```bash
npx convex dev
```

### 4. Start the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run linter
```

---

## 🔭 Vision

Internify is not just another internship portal. The long-term goal is a platform where:

- 🧑‍💻 Students prove skill through real work
- 🏢 Employers hire with stronger evidence
- 🤖 AI scales feedback, fairness, and evaluation

---

<div align="center">

Built by students, for students to prove skills through real work.

</div>
