# Internify

Internify is a two-sided learning-to-hiring platform built as a graduation project. It connects students with employers through real-world challenge tasks, giving students a way to prove their skills and giving employers a better way to discover talent beyond CV screening alone.

Instead of relying only on grades, resumes, or interviews, Internify is designed around practical work:

- Employers post tasks based on real needs.
- Students explore, accept, and complete those tasks.
- Submissions become proof of ability, not just claims on paper.
- AI support is being integrated as the next major phase of the platform.

## Why Internify?

We built Internify to solve a common problem on both sides:

- Students often graduate with theory but limited proof of real execution.
- Employers spend time filtering candidates without enough evidence of practical ability.
- Entry-level hiring becomes guesswork for companies and frustration for students.

Internify aims to close that gap by turning skill demonstration into the center of the experience.

## Current Features

### Public Platform Experience

- Landing page with role-based onboarding for students and employers
- About page explaining the motivation, problem, and vision behind the platform
- Auth flow with multi-step signup, login, forgot-password, and profile completion
- Role-aware AI assistant, **Dalil**, available across the platform

### Student Experience

- Student dashboard with overview, explore, messages, notifications, profile, and settings
- Explore tasks with real backend data, filtering, sorting, and task detail views
- Task acceptance flow with applicant limits
- Submission flow for accepted tasks
- Profile and portfolio-oriented student presentation

### Employer Experience

- Employer dashboard with analytics, task management, messages, notifications, profile, and settings
- Task posting and editing flow
- Applicant tracking and submission visibility
- Talent search experience for browsing student profiles and skills

### Platform Systems

- Clerk authentication integrated with Convex user persistence
- Real-time messaging and notifications
- Role-aware navigation and dashboard routing
- File upload support for tasks and submissions
- Retrieval-assisted chatbot pipeline using Groq, Pinecone, and Hugging Face

## AI Roadmap

AI is the next major track of Internify and is planned to cover:

- automated submission grading
- code and solution evaluation
- feedback generation for students
- fairer skill assessment support for employers
- stronger retrieval and assistant quality across the platform

This part of the project is intentionally presented as **planned / in progress**, since the team is still building the full AI evaluation logic.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Styling/UI:** Tailwind CSS v4, Radix UI, Lucide Icons, custom brutalist inspired design system
- **Auth:** Clerk
- **Backend / Database:** Convex
- **AI / Retrieval:** Groq (llama-3.3-70b-versatile), Pinecone, Hugging Face Inference (sentence-transformers/all-MiniLM-L6-v2)
- **Validation / Forms:** Zod, React Hook Form

## Design Inspiration

Internify uses a custom brutalist / neobrutalist visual system built on top of Tailwind, Radix primitives, and project-specific components.

Visual inspiration includes:

- **shadcn/ui** patterns for composable UI foundations
- **[neobrutalism.dev](https://www.neobrutalism.dev/)** as a design inspiration reference for bold, high-contrast neobrutalist component styling

> [!IMPORTANT]
> The project does **not** directly depend on neobrutalism.dev as a packaged UI framework. Instead, the current interface is a custom implementation tailored to Internify's brand, role colors, and interaction patterns.

---

## Project Structure

```bash
internify/
|-- src/
|   |-- app/
|   |   |-- page.tsx                    # Landing page + signed-in home entry
|   |   |-- about/page.tsx              # About / story page
|   |   |-- (auth)/                     # Login, signup, forgot-password, complete-profile
|   |   `-- api/
|   |       |-- chat/route.ts           # Chat assistant endpoint
|   |       `-- seed/route.ts           # Seed/testing helpers
|   |-- components/
|   |   |-- landing/                    # Landing page sections and navbar/footer
|   |   |-- student/                    # Student dashboard, explore, profile, submissions
|   |   |-- employer/                   # Employer dashboard, task management, analytics, talent search
|   |   |-- shared/                     # Messages, notifications, settings, profile modals
|   |   |-- about/                      # About page decorative/background components
|   |   |-- auth/                       # Auth-specific presentation components
|   |   |-- home/                       # Signed-in home controls
|   |   |-- providers/                  # App providers (Convex client, etc.)
|   |   `-- ui/                         # Reusable UI primitives and wrappers
|   `-- lib/
|       |-- convexAuth.ts               # Auth helpers bridging Clerk and Convex
|       |-- skillCatalog.ts             # Skill definitions and metadata
|       |-- skillMatching.ts            # Skill matching utilities
|       `-- utils.ts                    # Shared utility helpers
|-- convex/
|   |-- schema.ts                       # Database schema
|   |-- users.ts                        # User creation / profile logic
|   |-- tasks.ts                        # Task posting, acceptance, submissions, cleanup
|   |-- messages.ts                     # Real-time messaging logic
|   |-- notifications.ts                # Notification logic
|   |-- presence.ts                     # Typing / online presence handling
|   `-- nameLimits.ts                   # Name validation rules
|-- public/                             # Static assets, logos, and chatbot image
|-- package.json                        # Scripts and dependencies
`-- README.md                           # Project documentation
```

The product is organized around two main application surfaces:

- **Student side:** task discovery, task acceptance, submission flow, communication, and profile building
- **Employer side:** task posting, talent search, candidate communication, and submission review

Both are supported by shared infrastructure for authentication, notifications, messaging, settings, file handling, and AI assistance.

## Team

### Coding Leaders

- **Abdallah Hamada**
- **Selim Waleed**

### Full Team

- **Abdallah Hamada**
- **Selim Waleed**
- **Youseff Tarek**
- **Ahmed Hisham**
- **Abdallah Mousa**

## Contribution Highlights

The summary below is based on the current repository history and major implementation areas.

### Abdallah Hamada

Abdallah contributed to the platform foundation, frontend architecture, and large-scale product polish, including:

- setting up the initial project structure, global styles, landing page foundation, and early authentication architecture
- integrating Clerk with Convex and building the multi-step signup, login, profile-completion, OAuth redirect, password-validation UX, and auth-guard improvements
- leading major frontend work for the employer-facing experience, including task management UI, analytics, employer profile/settings, task-detail polish, and talent-search frontend work
- shaping the platform's visual direction through typography migration, repeated UI redesigns, landing page refinement, about page redesign, LogoLoop improvements, and consistent brutalist-style polish
- implementing and refining shared product systems such as notifications UX, typing and online indicators, message readability improvements, student settings/profile polish, accessibility cleanup, and many overflow/responsiveness fixes
- handling later structural fixes such as landing/dashboard route separation, dashboard tab-routing cleanup, signed-in navigation fixes, chatbot presentation polish, and expired-task cleanup support

### Selim Waleed

Selim contributed to the backend-connected product logic and role-based application flows, including:

- implementing important auth and form-related fixes such as unauthorized-access handling, password reset logic, input behavior fixes, captcha cleanup, and several signup/login UX improvements
- building the first real student dashboard flow, connecting explore tasks to backend data, improving filters, and replacing placeholder content with real task information
- implementing core student workflow logic, including task acceptance, applicant limits, and submission handling
- implementing employer dashboard functionality for task creation, listing, and statistics
- building talent-search related functionality, including student data retrieval and employer-facing search support
- implementing real messaging logic for both employer and student experiences, replacing dummy message data, and later polishing message-related UI consistency
- contributing to the AI-assistant effort through the actual dynamic role-aware Dalil integration

### Youseff Tarek

Planned focus area:

- AI evaluation pipeline
- submission analysis and grading research
- intelligent scoring and feedback logic
- Certificate generation

### Ahmed Hisham

Planned focus area:

- AI experimentation and model workflow design
- evaluation quality improvements
- assistant and grading system support
- AI cv generator and analyzer

### Abdallah Mousa

Mousa contributed to updating Convex and Clerk's authentication and Integration.

Planned focus area:

- AI implementation support
- evaluation pipeline integration
- infrastructure support for the AI stage of the platform
- AI recommendation system

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

At minimum, the app expects configuration for:

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

Then open:

```bash
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project Status

Internify is actively under development as a graduation project.

Current status:

- core student and employer flows are implemented
- authentication, dashboards, messaging, notifications, and task workflows are in place
- AI assistant support exists
- full AI submission grading and evaluation is the next major milestone

## Vision

Internify is not just meant to be another internship portal. The long-term goal is to build a platform where:

- students prove skill through work
- employers hire with stronger evidence
- AI helps scale feedback, fairness, and evaluation

That is the direction this project is growing toward.

---

## Links

- **Live Site**: [internify-one.vercel.app](https://internify-one.vercel.app/)
- **GitHub**: [github.com/AbdullahHamadax/internify](https://github.com/AbdullahHamadax/internify)
- **Author**: [@AbdullahHamadax](https://github.com/AbdullahHamadax)

---

<div align="center">
  <p>Built by students to help students prove their skills through real work.</p>
</div>
