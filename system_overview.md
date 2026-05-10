# InteractHub — System Overview

---

## 1. System Overview

- **Frontend Technology**
  - Framework: React 18 with TypeScript (Vite build tool)
  - Styling: Tailwind CSS
  - HTTP Client: Axios (with request/response interceptors)
  - Routing: React Router DOM v6
  - Deployment: Docker container (Nginx), Vercel-compatible

- **Backend Technology**
  - Framework: ASP.NET Core Web API (.NET 8)
  - Auth: ASP.NET Core Identity + JWT Bearer
  - ORM: Entity Framework Core (EF Core)
  - API Documentation: Swagger / OpenAPI
  - Deployment: Docker container, Render.com (hosted at `https://interacthub-api1.onrender.com`)

- **Database**
  - Engine: MySQL 8.0
  - Hosted on: Railway (production), Docker Compose (local)
  - ORM Migrations: EF Core Code-First migrations

- **External Services**
  - Cloudinary — image and video file upload/storage (CDN delivery)
  - Railway — managed MySQL database hosting
  - Render.com — backend API hosting
  - Vercel / Docker — frontend hosting options

---

## 2. Frontend

### Pages and Routes

| Route | Page Component | Access |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/register` | `RegisterPage` | Public |
| `/` | `HomePage` | Protected |
| `/profile/:id` | `ProfilePage` | Protected |
| `/friends` | `FriendsPage` | Protected |
| `/notifications` | `NotificationsPage` | Protected |
| `/jobs` | `JobsPage` | Protected |
| `/messaging` | `MessagingPage` | Protected |
| `/search` | `SearchPage` | Protected |
| `/admin/reports` | `AdminReportsPage` | Protected |
| `/article/new` | `ArticleEditorPage` | Protected |
| `/saved` | `SavedPage` | Protected |
| `/post/:id` | `PostDetailPage` | Protected |
| `*` | Redirect to `/` | — |

- All protected routes are wrapped in a `ProtectedRoute` component that checks authentication state before rendering
- Unauthenticated access redirects to `/login`

### State Management (Context & Hooks)

- **`AuthContext` / `AuthProvider`** (`hooks/useAuth.tsx`)
  - Global React Context wrapping the entire application
  - Holds: `user`, `isAuthenticated`, `loading`
  - Methods: `login(data)`, `logout()`, `updateUser(data)`
  - Persists session to `localStorage` (keys: `token`, `user`)
  - On mount: reads `localStorage` to restore session automatically

- **`useAuth` Hook**
  - Consumes `AuthContext` in any component
  - Provides: current user object, auth status, login/logout actions

- **`useUpload` Hook** (`hooks/useUpload.ts`)
  - Encapsulates file upload logic via the backend Upload API

### API Calls

- All HTTP calls go through a shared **Axios instance** (`services/api.ts`)
  - Base URL: `https://interacthub-api1.onrender.com/api`
  - Request interceptor: automatically attaches `Authorization: Bearer <token>` header from `localStorage`
  - Response interceptor: on `401 Unauthorized`, clears `localStorage` and redirects to `/login`

- **Frontend Service Modules** (each wraps Axios calls):
  - `authService.ts` — `POST /Auth/register`, `POST /Auth/login`
  - `postService.ts` — CRUD for posts, like/unlike, comments
  - `profileService.ts` — get/update user profile, experiences, education, skills
  - `friendService.ts` — send/accept/reject/unfriend
  - `followService.ts` — follow/unfollow users
  - `messageService.ts` — conversations, send/get messages
  - `notificationService.ts` — get notifications, mark as read
  - `jobService.ts` — list/create/apply for jobs
  - `userService.ts` — search users
  - `hashtagService.ts` — trending hashtags
  - `jwt.ts` — client-side JWT parsing and role extraction (Admin check)

---

## 3. Backend

### Controllers

| Controller | Route Prefix | Responsibility |
|---|---|---|
| `AuthController` | `/api/Auth` | Register, Login, JWT token generation |
| `PostsController` | `/api/Posts` | Post CRUD, likes, comments, shares, save/unsave, hashtag feed |
| `ProfileController` | `/api/Profile` | View/edit profile, experience, education, skills |
| `UsersController` | `/api/Users` | Search users, get user details, block/unblock |
| `FriendsController` | `/api/Friends` | Send/accept/reject/cancel/unfriend, list friends & requests |
| `FollowController` | `/api/Follow` | Follow/unfollow, followers/following lists |
| `MessagesController` | `/api/Messages` | Conversations, send/receive messages |
| `NotificationsController` | `/api/Notifications` | Get notifications, mark read/all-read |
| `JobsController` | `/api/Jobs` | Post/list/apply for jobs, manage applications |
| `StoriesController` | `/api/Stories` | Create/view/delete stories, track story views |
| `HashtagsController` | `/api/Hashtags` | Trending hashtags |
| `ReportsController` | `/api/Reports` | Report posts/users, admin review, action logs, appeals |
| `UploadController` | `/api/Upload` | Upload images/videos to Cloudinary |
| `DevController` | `/api/Dev` | Development/admin utilities (seed data, role management) |
| `BaseApiController` | — | Shared base class for all controllers |

### Services and Interfaces

| Interface | Implementation | Responsibility |
|---|---|---|
| `IAuthService` | `AuthService` | Register user, validate login, generate JWT |
| `IPostService` | `PostService` | Post CRUD, like/unlike toggle, hashtag linking |
| `IFriendService` | `FriendService` | Friend requests: send, accept, reject, list friends & pending |
| `INotificationService` | `NotificationService` | Create, fetch, and mark notifications |
| `IUserService` | `UserService` | Get profile, update profile, search users |
| `IUploadService` | `UploadService` | Upload/delete images and videos via Cloudinary SDK |

- All services are registered in DI as **Scoped** (`AddScoped`) in `Program.cs`
- Services access the database directly through `AppDbContext` (no separate repository layer in practice)

### Middleware

- **JWT Bearer Authentication Middleware** (built-in ASP.NET Core)
  - Validates `Authorization: Bearer <token>` on every request
  - Validates issuer, audience, lifetime, and signing key (HMAC-SHA256)
  - Populates `HttpContext.User` with claims on success

- **`LastActiveMiddleware`** (`Helpers/LastActiveMiddleware.cs`)
  - Runs after authentication on every authenticated request
  - Reads `ClaimTypes.NameIdentifier` from the authenticated user
  - Writes the current UTC timestamp to `AppUser.LastActiveAt` in the database
  - Enables online/last-seen presence tracking

- **CORS Middleware**
  - Policy `AllowReact`: allows any origin, any header, any method (compatible with Vercel/external frontends)
  - Note: `AllowCredentials()` is intentionally NOT used (incompatible with `AllowAnyOrigin`)

- **Pipeline Order**: `UseRouting` → `UseCors` → `UseAuthentication` → `LastActiveMiddleware` → `UseAuthorization` → `MapControllers`

---

## 4. Database

### Main Tables and Fields

- **AspNetUsers** (extends ASP.NET Identity)
  - `Id`, `UserName`, `Email`, `PasswordHash`
  - `FullName`, `Bio`, `AvatarUrl`, `CoverUrl`
  - `DateOfBirth`, `CreatedAt`, `IsActive`, `LastActiveAt`
  - `JobTitle`, `Company`, `Location`
  - `GitHubUrl`, `WebsiteUrl`, `LinkedInUrl`

- **Posts**
  - `Id`, `Content`, `ImageUrl`
  - `CreatedAt`, `UpdatedAt`, `IsDeleted`
  - `CommentPermission` (values: `everyone`, `connections`, `none`)
  - `UserId` (FK → AspNetUsers)
  - `SharedPostId` (FK → Posts, nullable — for reposts/shares)

- **Comments**
  - `Id`, `Content`, `IsDeleted`, `CreatedAt`
  - `PostId` (FK → Posts), `UserId` (FK → AspNetUsers)
  - `ParentCommentId` (FK → Comments, nullable — for nested replies)

- **CommentReactions**
  - `Id`, `Type` (reaction emoji/type)
  - `CommentId` (FK → Comments), `UserId` (FK → AspNetUsers)

- **Likes**
  - `Id`, `CreatedAt`
  - `PostId` (FK → Posts), `UserId` (FK → AspNetUsers)
  - Unique index on (`UserId`, `PostId`)

- **Friendships**
  - `Id`, `Status` (Pending / Accepted / Rejected), `CreatedAt`, `UpdatedAt`
  - `SenderId` (FK → AspNetUsers), `ReceiverId` (FK → AspNetUsers)

- **Follows**
  - `Id`, `CreatedAt`
  - `FollowerId` (FK → AspNetUsers), `FollowingId` (FK → AspNetUsers)
  - Unique index on (`FollowerId`, `FollowingId`)

- **Stories**
  - `Id`, `MediaUrl`, `CreatedAt`, `ExpiresAt`, `IsDeleted`
  - `UserId` (FK → AspNetUsers)

- **StoryViews**
  - `Id`, `ViewedAt`
  - `StoryId` (FK → Stories), `ViewerId` (FK → AspNetUsers)

- **Notifications**
  - `Id`, `Message`, `Type`, `IsRead`, `CreatedAt`
  - `RelatedEntityId` (nullable string, references any entity)
  - `UserId` (FK → AspNetUsers)

- **Hashtags**
  - `Id`, `Name`, `UseCount`

- **PostHashtags** (join table)
  - Composite PK: (`PostId`, `HashtagId`)
  - `PostId` (FK → Posts), `HashtagId` (FK → Hashtags)

- **Conversations**
  - `Id`, `CreatedAt`, `LastMessageAt`
  - `User1Id` (FK → AspNetUsers), `User2Id` (FK → AspNetUsers)

- **Messages**
  - `Id`, `Content`, `SentAt`, `IsRead`
  - `ConversationId` (FK → Conversations), `SenderId` (FK → AspNetUsers)

- **Jobs**
  - `Id`, `Title`, `Description`, `Company`, `Location`, `Type`
  - `Salary`, `CreatedAt`, `IsActive`
  - `PostedById` (FK → AspNetUsers)

- **JobApplications**
  - `Id`, `CoverLetter`, `Status`, `AppliedAt`
  - `JobId` (FK → Jobs), `ApplicantId` (FK → AspNetUsers)

- **Reports**
  - `Id`, `Reason`, `Description`, `Status`, `CreatedAt`
  - `ReporterId` (FK → AspNetUsers), `ReportedUserId` (FK → AspNetUsers)

- **PostReports**
  - `Id`, `Reason`, `CreatedAt`
  - `PostId` (FK → Posts), `ReporterId` (FK → AspNetUsers)

- **ReportActionLogs**
  - `Id`, `Action`, `Notes`, `CreatedAt`
  - `ReportId` (FK → Reports), `AdminId` (FK → AspNetUsers)

- **Experiences**
  - `Id`, `Company`, `Title`, `StartDate`, `EndDate`, `Description`
  - `UserId` (FK → AspNetUsers)

- **Educations**
  - `Id`, `School`, `Degree`, `Field`, `StartYear`, `EndYear`
  - `UserId` (FK → AspNetUsers)

- **Skills**
  - `Id`, `Name`
  - `UserId` (FK → AspNetUsers)

- **AspNetRoles / AspNetUserRoles** (Identity tables)
  - Seeded roles on startup: `User`, `Admin`

---

## 5. Authentication Flow

### Step-by-Step Login + JWT Process

1. **User submits credentials** — The frontend (`LoginPage`) sends a `POST /api/Auth/login` request with `{ email, password }` via `authService.ts`

2. **Controller receives request** — `AuthController.Login()` validates the model; if invalid, returns `400 Bad Request`

3. **User lookup** — `UserManager.FindByEmailAsync(email)` queries `AspNetUsers`; if not found, returns `401 Unauthorized`

4. **Password validation** — `UserManager.CheckPasswordAsync(user, password)` verifies the hashed password; if wrong, returns `401 Unauthorized`

5. **JWT generation** — `GenerateJwtToken(user)` builds a signed token:
   - Claims included: `NameIdentifier` (userId), `Email`, `Name` (username), `FullName`, `Role` (from Identity roles)
   - Algorithm: HMAC-SHA256
   - Signed with: `JwtSettings:SecretKey` from `appsettings.json`
   - Issuer: `InteractHub`, Audience: `InteractHubUsers`
   - Expiry: 7 days from issue time

6. **Response returned** — Backend returns `200 OK` with `{ token, userId, username, email, fullName, avatarUrl, expiresAt }`

7. **Frontend stores session** — `useAuth.login(data)` saves `token` and `user` JSON to `localStorage`; React state is updated

8. **Subsequent requests** — Axios request interceptor attaches `Authorization: Bearer <token>` to every API call automatically

9. **Token validation per request** — ASP.NET Core JWT middleware validates the token on each protected endpoint; success populates `HttpContext.User`

10. **`LastActiveMiddleware` runs** — After auth, reads the user ID from claims and updates `LastActiveAt` in the database

11. **Session expiry / `401` handling** — If the token expires or is invalid, the API returns `401`; the Axios response interceptor clears `localStorage` and redirects to `/login`

12. **Admin role check** — `jwt.ts` on the frontend parses the JWT payload client-side to detect the `Admin` role for conditional UI rendering (e.g., `AdminReportsPage`)

---

## 6. Service Relationships

- **`AuthController`**
  - Depends on: `UserManager<AppUser>` (ASP.NET Identity), `IConfiguration` (JWT settings)
  - Does NOT use `IAuthService` (business logic is inlined in the controller directly)

- **`IAuthService` / `AuthService`**
  - Depends on: `UserManager<AppUser>`, `IConfiguration`
  - Used by: (standalone — not wired to a controller, acts as an alternative DI-registered implementation)

- **`IPostService` / `PostService`**
  - Depends on: `AppDbContext`
  - Used by: `PostsController`
  - Internally interacts with: `Posts`, `Likes`, `Comments`, `Hashtags`, `PostHashtags`

- **`IFriendService` / `FriendService`**
  - Depends on: `AppDbContext`
  - Used by: `FriendsController`
  - Internally interacts with: `Friendships`, `AspNetUsers`

- **`INotificationService` / `NotificationService`**
  - Depends on: `AppDbContext`
  - Used by: `NotificationsController`, and consumed internally by other controllers (e.g., `PostsController`, `FriendsController`) to create notifications on events

- **`IUserService` / `UserService`**
  - Depends on: `AppDbContext`
  - Used by: `UsersController`, `ProfileController`
  - Internally interacts with: `AspNetUsers`, `Friendships`

- **`IUploadService` / `UploadService`**
  - Depends on: `IConfiguration` (Cloudinary credentials), `Cloudinary` SDK
  - Used by: `UploadController`
  - External dependency: **Cloudinary API**

- **`AppDbContext`**
  - Depended on by: `PostService`, `FriendService`, `NotificationService`, `UserService`, `LastActiveMiddleware`
  - Backed by: **MySQL** via EF Core + Pomelo MySQL driver

- **`LastActiveMiddleware`**
  - Depends on: `AppDbContext`
  - Runs on: every authenticated HTTP request (injected per-request from DI)

- **Frontend `api.ts` (Axios instance)**
  - Depended on by: all frontend service modules (`authService`, `postService`, `profileService`, `friendService`, `followService`, `messageService`, `notificationService`, `jobService`, `userService`, `hashtagService`)
  - Depends on: `localStorage` (for JWT token retrieval)
