# InteractHub.API

This README describes the repository layout, responsibilities of the main files/folders and how to run the API locally (Windows PowerShell). The explanations are concise so you can quickly onboard or find where to change behaviour.

---

## Project overview

`InteractHub.API` is an ASP.NET Core Web API project that implements a social app backend. It includes features such as posts, comments (with replies and reactions), stories (with views and reactions), messaging (conversations/messages), follows, friendships (connections), notifications, job postings, user profiles and basic hashtag support.

The API uses Entity Framework Core for persistence and ASP.NET Identity for user accounts (see `AppUser` in `Models/Entities`).

---

## How to run (Windows PowerShell)

1. Restore and build

```powershell
cd 'd:\InteractHub\InteractHub.API'
dotnet restore
dotnet build
```

2. Run in development

```powershell
# runs with default launch configuration (Kestrel)
dotnet run
```

3. Common troubleshooting
- If EF migrations are out-of-sync: `dotnet ef database update` (requires dotnet-ef installed)
- Check `appsettings.Development.json` for development DB connection string and other settings

---

## Top-level files

- `Program.cs` — App entrypoint and DI registration (services, DB context, authentication, CORS, etc.).
- `InteractHub.API.csproj` — .NET project file with package references and target framework (net8.0 in this workspace).
- `appsettings.json` / `appsettings.Development.json` — Configuration files (connection strings, logging, 3rd-party keys).
- `README.md` — (this file) project description and structure.

---

## Major folders and their roles

- `Controllers/`
  - Holds ASP.NET Core controllers that expose REST endpoints. Key controllers:
    - `AuthController.cs` — authentication endpoints (login/register/token operations).
    - `UsersController.cs` — user profile endpoints (get/update profile, search users).
    - `PostsController.cs` — create/read/update/delete posts; likes; comments & replies; save post; reactions.
    - `StoriesController.cs` — create/view/react to stories; track views and list viewers.
    - `MessagesController.cs` — conversation and message endpoints (get conversations, send messages, mark read).
    - `FollowController.cs` — follow/unfollow endpoints and status.
    - `FriendsController.cs` — friendship/connection requests and accept/reject flows.
    - `NotificationsController.cs` — list, mark read, and create simple notifications.
    - `UploadController.cs` — endpoints to upload avatars/images (if implemented).
    - `JobsController.cs` — job posting and applications (if implemented).
    - `HashtagsController.cs`, `ProfileController.cs`, `StoriesController.cs`, `UploadController.cs` — additional features.

- `Data/`
  - `AppDbContext.cs` — EF Core DbContext; defines DbSets and relationships.
  - EF Core is configured here for model building (indexes, composite keys, delete behaviors).

- `Models/Entities/`
  - Entity classes representing database tables (e.g., `Post`, `Comment`, `Like`, `Story`, `StoryView`, `Conversation`, `Message`, `Notification`, `AppUser`, `Friendship`, `Follow`, `CommentReaction`, etc.).
  - These classes contain navigation properties used by EF Core.

- `DTOs/`
  - Data Transfer Objects used by controllers to shape request/response payloads.
  - Organized by feature: `Post`, `User`, `Auth`, `Comments`, `Common`, etc. Example: `PostResponseDto`, `CreatePostDto`, `UpdateProfileDto`.

- `Services/`
  - Service interfaces and implementations (e.g., `IUserService`, `UserService`, `INotificationService`, `NotificationService`).
  - Business logic that is reusable across controllers.

- `Repositories/`
  - (If present) repository layer abstractions and implementations for data access logic.

- `Migrations/`
  - EF Core migration files generated for schema changes. Keep this folder under source control so other developers can update the DB schema consistently.

- `Controllers/` and `DTOs/` are where most product-facing changes happen.

- `Properties/launchSettings.json`
  - Local development launch profiles (URLs, environment variables for debugging).

- `bin/`, `obj/`
  - Build outputs and intermediate files. Usually ignored by VCS but included here in the workspace snapshot.

---

## Important flows & where to change them

- Stories
  - Create: `StoriesController.CreateStory`
  - View + track view: `StoriesController.ViewStory` and `StoryView` entity. Views are stored in `StoryViews` table; count is `Story.Views.Count`.
  - Send message from story: `StoriesController.SendMessageToStory` creates/uses a `Conversation` and `Message` and adds a `Notification` with `RelatedEntityId` set to the story id.

- Posts & Comments
  - Posts CRUD: `PostsController` (CreatePost, UpdatePost, DeletePost).
  - Likes/Reaction: `PostsController.LikePost` and `GetReactions`.
  - Comments: `PostsController.AddComment`, `ReplyComment` — replies use `ParentCommentId` to build a comment tree.
  - Comment Reactions: `PostsController.ReactComment` uses `CommentReaction` entity; reaction counts and whether current user reacted are included when fetching comments.
  - Saved posts: implemented using `Notifications` with `Type = "saved"` (quick approach). See `PostsController.SavePost` and `GetSavedPosts`. Consider creating a `SavedPost` table for clarity and performance.

- Messaging
  - `MessagesController` implements conversations and messages. Use `Conversations` and `Messages` tables. `SendMessage` creates a `Message` and updates `Conversation.UpdatedAt`.

- Connection / Friends
  - `Friendship` entity and `FriendsController` / `FollowController` manage friend/connection requests and follow relationships.
  - `UsersController.SearchUsers` returns `IsConnected` by checking the `Friendships` table.

- Notifications
  - Notifications are stored in the `Notifications` table (see `Notification` entity). Controllers and services create notifications for likes, comments, follows and system messages. The `NotificationsController` exposes endpoints to list and mark as read and a `unread-counts` endpoint (aggregates messages unread, pending connection requests, and general unread notifications).

---

## API conventions

- Most endpoints use REST patterns and return `ApiResponse<T>` objects located in `DTOs/Common/ApiResponse.cs` to standardize success/failure payloads.
- Authentication: endpoints are decorated with `[Authorize]` and user id is read from JWT/Claims (`ClaimTypes.NameIdentifier`).
- Date/time: entities default to `DateTime.UtcNow`.

---

## Development tips & next improvements

- Use a dedicated `SavedPosts` table instead of using `Notifications` to represent saved posts. This improves query performance and intent clarity.
- Implement SignalR for real-time notifications and message delivery.
- Add unit/integration tests (xUnit/NUnit) for controllers and services.
- Implement pagination on lists (posts, notifications) consistently (some endpoints already have page parameters).
- Front-end contract: ensure front-end provides `AvatarUrl` and `CoverUrl` only when they should be updated. Back-end protects against null overwrites when updating user profile.

---

## Contributing

- Create a feature branch from `main` or `develop`.
- Keep migrations consistent: if you change entities, create a new EF migration and commit it.
- Run `dotnet build` and, if applicable, `dotnet ef database update` before opening a PR.

---

If you'd like, I can also:
- Generate an OpenAPI/Swagger summary of the endpoints.
- Create a short Postman collection (JSON) for common endpoints.
- Add an example `.env`/`appsettings.Development.json` template for local development.


