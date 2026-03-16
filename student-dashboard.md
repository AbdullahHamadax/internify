# Student Dashboard - Implementation Plan

## Overview
Implement the Student Dashboard based on "Option C: The Modular Overview". The dashboard will serve as the primary hub for students, featuring a modular summary view (Dashboard) for tracking ongoing applications and a dedicated full-market discovery view (Explore). We are focusing strictly on the frontend UI/UX using mocked data.

## Project Type
WEB

## Success Criteria
- Students see a highly professional, modern dashboard upon login.
- A "Modular Overview" provides personalized task recommendations and status tracking.
- An "Explore" tab surfaces a comprehensive list of all fake/mock tasks with UI for filtering and claiming.
- Design strictly adheres to the `frontend-specialist` principles: non-generic layouts, strong typography, zero use of purple defaults, and lively micro-animations.

## Tech Stack
- React / Next.js (App Router)
- Tailwind CSS (Custom styling, avoiding safe cliché templates)
- Lucide React (Icons)
- Mock Data (Since backend is out of scope)

## File Structure
```
src/
└── components/
    └── student/
        ├── StudentDashboard.tsx       (Main container with navigation state)
        ├── StudentOverview.tsx        (Option C Modular Widget View)
        ├── StudentExplore.tsx         (Marketplace Task Grid View)
        ├── TaskCard.tsx               (Reusable UI for single tasks)
        └── student-dashboard.css      (Custom typography, animations, and grid breaks)
```

## Task Breakdown

### Task 1: Initialize Dashboard Container
- **Agent:** `frontend-specialist`
- **Dependencies:** None
- **INPUT:** `src/app/page.tsx`, `src/components/SignedInView.tsx`
- **OUTPUT:** New `StudentDashboard.tsx` that replaces `SignedInView` with a side/top navigation structure (Dashboard vs Explore).
- **VERIFY:** Logging in as a student shows the new blank dashboard shell instead of the old welcome screen.

### Task 2: Build the Modular Overview (Dashboard Tab)
- **Agent:** `frontend-specialist`
- **Dependencies:** Task 1
- **INPUT:** `StudentOverview.tsx`
- **OUTPUT:** A custom asymmetric grid featuring: User Stats Widget, "Recommended Tasks" list, and "Active Claims" pipeline. Uses sharp geometric design and bold color palette (excluding purple).
- **VERIFY:** The dashboard tab renders the mocked widgets visually correctly and adaptively on mobile and desktop.

### Task 3: Build the Explore/Marketplace (Explore Tab)
- **Agent:** `frontend-specialist`
- **Dependencies:** Task 1
- **INPUT:** `StudentExplore.tsx`
- **OUTPUT:** A full-page task discovery interface with a mock search/filter sidebar and a distinct layout differing from the standard "bento grid". Includes a grid of `TaskCard` components.
- **VERIFY:** Clicking the Explore tab shows the marketplace with search UI and multiple mock tasks.

### Task 4: Polish & Animations
- **Agent:** `frontend-specialist`
- **Dependencies:** Task 2, Task 3
- **INPUT:** `student-dashboard.css`
- **OUTPUT:** Addition of staggered reveal animations, hover spring physics, and layered visual depth to break static flatness.
- **VERIFY:** Inspecting elements reveals functional CSS transitions/animations on hover and mount.

## ✅ Phase X: Verification
- Lint: `npm run lint`
- UX Audit: Verify non-cliché topology and color schemes manually.
- Build: `npm run build`
