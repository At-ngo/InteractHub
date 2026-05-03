# InteractHub — Frontend (React + TypeScript + Vite)

This repository contains the frontend for InteractHub — a social-style web app built with React, TypeScript and Vite. The project follows a component-based structure and calls a backend API (configured in `src/services/api.ts`) for data.

This README documents the project structure and the responsibility of important files so you (or new contributors) can find code faster.

## Quick start

Prerequisites:
- Node.js (16+ recommended)
- npm (or use pnpm/yarn if you prefer — adjust commands accordingly)

Install and run dev server (PowerShell):

```powershell
cd D:\InteractHub\interacthub-frontend
npm install
npm run dev
```

Build for production:

```powershell
npm run build
```

Preview production build:

```powershell
npm run preview
```

Lint (if configured):

```powershell
npm run lint
```

## Project scripts (package.json)
- `dev`: Start Vite dev server (HMR).
- `build`: Type-check (`tsc -b`) and build with Vite.
- `preview`: Preview production build.
- `lint`: Run ESLint.

## High-level folder structure

- `index.html` — app entry HTML used by Vite.
- `vite.config.ts` — Vite configuration (React plugin, aliases, etc.).
- `package.json` / `tsconfig.*` / `postcss.config.js` / `tailwind.config.js` — tooling and config files.
- `public/` — static assets (favicon, SVG icons).
- `src/` — application source code (detailed below).

## src/ — detailed layout and responsibilities

Top-level files:
- `main.tsx` — React entry point. Mounts the app and any providers (router, auth provider).
- `App.tsx` — main route container, defines routes and global layouts.
- `index.css`, `App.css` — global styles (Tailwind + custom CSS).

Directories and important files:

- `src/components/`
  - `layout/`
    - `MainLayout.tsx` — Main page layout wrapper (renders Navbar, sidebars, content area).
    - `Navbar.tsx` — Top navigation bar: logo, search input (with search history), center nav icons (home, friends, jobs, messages, notifications with badge counts), right side (DarkModeToggle, avatar/profile, login/logout). Also polls the API for unread counts.
  - `common/`
    - `Avatar.tsx` — Small reusable avatar component (image or initials fallback).
    - `DarkModeToggle.tsx` — Toggles dark mode (updates document classes + localStorage).
    - `LoadingSpinner.tsx` — Simple loader used across pages.
    - `TrendingSidebar.tsx` — Right-column trends / suggestions UI.
  - `post/`
    - `PostCard.tsx` — Card component for posts: rendering content, image, like/reaction logic, comments, save/share, message actions. Handles comment replies rendering and reaction UI.
    - `CreatePostCard.tsx` — UI for creating posts (editor + upload integration).
    - `StoriesBar.tsx` — Stories UI (create story, view stories, send message from story, view counts). Contains logic for grouping stories and playing them.
  - `user/`
    - `ProfileCard.tsx` — User card used in lists and sidebars.

- `src/pages/`
  - `HomePage.tsx` — Home feed, composes `StoriesBar`, posts list, sidebar.
  - `LoginPage.tsx` / `RegisterPage.tsx` — Auth pages (login/register forms).
  - `ProfilePage.tsx` — Profile view and profile editing. Handles avatar/cover upload (uses `useUpload` hook), shows posts by user, follow/connect actions, and edit form. Includes fixes to preserve avatar/cover when saving profile edits.
  - `MessagingPage.tsx` — Conversation UI (list of conversations + messages). Uses `messageService` for get/create/send operations.
  - `NotificationsPage.tsx` — Notification list, mark as read, and navigation to related entity (post/profile/message) when possible.
  - `SavedPage.tsx` — Shows posts saved by the user.
  - `SearchPage.tsx` — Shows search results for users.
  - `FriendsPage.tsx` — Manage connections, pending requests, and suggestions ("Người bạn có thể biết"). Suggestions are marked if already connected.

- `src/hooks/`
  - `useAuth.tsx` — Auth context provider and hook. Keeps `user` and `token` from localStorage and exposes login/logout/updateUser helpers.
  - `useUpload.ts` — Upload helper hook (uploads images to backend or storage and returns URLs).

- `src/services/`
  - `api.ts` — Axios instance with baseURL (`http://localhost:5271/api` by default) and interceptors to attach JWT token and handle 401 (redirect to login).
  - `authService.ts` — Auth-related API calls (login/register, etc.).
  - `postService.ts` — Post-related API calls (get posts, add comment, get comments, create post, delete, reactions, saved list, etc.).
  - `messageService.ts` — Messaging API helper (getConversations, getOrCreateConversation, getMessages, sendMessage). Used by PostCard, StoriesBar, ProfilePage and Messaging page.
  - `notificationService.ts` — Get notifications and mark read/read-all endpoints.
  - `profileService.ts`, `userService.ts`, `friendService.ts`, `followService.ts`, `hashtagService.ts`, `jobService.ts`, `notificationService.ts` — Other domain services used throughout the app. Each service wraps axios calls and returns the typed ApiResponse.

- `src/types/index.ts` — Shared TypeScript interfaces used across the app (User, Post, Comment, Notification, ApiResponse, AuthResponse, etc.). Keep types here in sync with backend responses.

## Important implementation notes
- The UI expects the backend to return a consistent `ApiResponse<T>` shape ({ success, message, data, errors }). Many frontend flows depend on `res.data.success` and `res.data.data`.
- Authentication: `useAuth` stores token + user in localStorage. `api.ts` attaches `Authorization: Bearer <token>` automatically.
- Stories and messaging interaction: `StoriesBar` may create or fetch conversations using `messageService.getOrCreateConversation` and then `messageService.sendMessage`. The message content currently embeds a reference to the story (id + small text). You can adjust payload/format based on backend expectations.
- Save / unsave behavior: frontend toggles visual saved state based on server response. Ensure server returns either the toggled state or the saved list when needed for reliable UI.

## Troubleshooting / Development tips
- If TypeScript build fails due to unused variables (TS6133), either remove the variable or use it. The project is type-checked before the Vite build (see `npm run build`).
- To debug network/API issues, open browser DevTools → Network and inspect request/response bodies and status codes.
- If notifications should route to specific items, make sure `Notification` objects include a `relatedEntityId` (postId/userId/conversationId) or include an explicit URL.

## Next steps / TODO (suggested)
- Add unit tests for services & hooks.
- Add stronger linting and pre-commit hooks (husky) to avoid accidental unused code.
- Improve error handling & user feedback (toasts) for network errors.

---

If you want, I can:
- Generate an explicit tree listing every file in `src/` with one-line purpose each.
- Add a simple CONTRIBUTING.md with local dev notes and common workflows.

Tell me which of those you prefer and I will add it to this README.
