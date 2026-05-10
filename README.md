# InteractHub

> **Mạng xã hội chuyên nghiệp** — LinkedIn Clone được xây dựng với ASP.NET Core 8 (backend) và React 19 + Vite (frontend).

Các tính năng chính: đăng ký / đăng nhập JWT, đăng bài viết, kết bạn, nhắn tin, thông báo real-time, stories, hashtag, báo cáo nội dung, tìm kiếm việc làm.

---

## ⚙️ Setup & Installation

### Prerequisites

| Tool | Version tối thiểu | Link |
|---|---|---|
| .NET SDK | 8.0 | [download](https://dotnet.microsoft.com/download/dotnet/8.0) |
| Node.js | 20+ | [download](https://nodejs.org) |
| Git | bất kỳ | [download](https://git-scm.com) |

> Docker là tùy chọn — chỉ cần nếu muốn chạy stack qua Docker Compose.
> Database dùng **Railway (MySQL)** — không cần cài MySQL local.

---

### 1. Clone repository

```bash
git clone https://github.com/At-ngo/InteractHub.git
cd InteractHub
```

---

### 2. Cấu hình Backend

#### 2.1 Tạo file `appsettings.Development.json`

File này ghi đè lên `appsettings.json` khi chạy môi trường Development.
Tạo tại `InteractHub.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=<RAILWAY_HOST>;Port=<PORT>;Database=railway;User=root;Password=<PASSWORD>;SslMode=None;AllowPublicKeyRetrieval=True;"
  },
  "JwtSettings": {
    "SecretKey": "<ít_nhất_32_ký_tự_bất_kỳ>",
    "Issuer": "InteractHub",
    "Audience": "InteractHubUsers",
    "ExpirationDays": 7
  },
  "Cloudinary": {
    "CloudName": "<CLOUDINARY_CLOUD_NAME>",
    "ApiKey": "<CLOUDINARY_API_KEY>",
    "ApiSecret": "<CLOUDINARY_API_SECRET>"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

> ⚠️ **Không commit file này** — nó đã có trong `.gitignore`.

#### 2.2 Lấy thông tin Railway

1. Đăng nhập [railway.app](https://railway.app)
2. Vào project → chọn service **MySQL**
3. Tab **Connect** → sao chép các giá trị: `Host`, `Port`, `Password`

#### 2.3 Tạo Cloudinary account

1. Đăng ký tại [cloudinary.com](https://cloudinary.com) (miễn phí)
2. Vào **Dashboard** → sao chép `Cloud Name`, `API Key`, `API Secret`
3. Điền vào `appsettings.Development.json` ở bước 2.1

---

### 3. Cấu hình Frontend

Tạo file `.env.local` trong thư mục `interacthub-frontend/` (dựa theo `.env.example`):

```bash
cd interacthub-frontend
cp .env.example .env.local   # Linux/macOS
# hoặc: copy .env.example .env.local   # Windows
```

Sau đó chỉnh nội dung `.env.local`:

```env
# Khi dev local: trỏ vào backend đang chạy
VITE_API_BASE_URL=http://localhost:5271
```

> File `.env.production` đã có sẵn và trỏ vào URL Render — không cần sửa khi deploy.

---

### 4. Cài đặt dependencies

**Backend:**
```bash
cd InteractHub.API
dotnet restore
```

**Frontend:**
```bash
cd interacthub-frontend
npm install
```

---

### 5. Database Migration

Không cần chạy migration thủ công. `Program.cs` đã có:

```csharp
await dbContext.Database.MigrateAsync();
```

Schema sẽ tự động được áp dụng khi backend khởi động lần đầu.

---

## 🖥️ Local Development

- Backend: `InteractHub.API` (ASP.NET Core)
- Frontend: `interacthub-frontend` (React + Vite)

Run backend locally:

```powershell
cd InteractHub.API
#$env:ASPNETCORE_ENVIRONMENT='Development'
dotnet run
```

Run frontend locally:

```powershell
cd interacthub-frontend
npm install
npm run dev
```

### Local Docker (recommended for parity)

Build and run the stack (MySQL + API + frontend):

```powershell
docker compose build
docker compose up
```

Khi chạy local Docker: API tại `http://localhost:5271`, frontend tại `http://localhost:5173`.

> **Production:** Backend deploy trên **Render**, Frontend deploy trên **Vercel**, Database (MySQL) trên **Railway**.

## CI/CD

**CI** — `.github/workflows/ci.yml` chạy trên mọi push/PR vào `main`:
- Build & chạy 36 unit tests (.NET)
- Build frontend (React/Vite)

**CD** — `.github/workflows/cd.yml` chạy tự động khi push vào `main`:
- 🚀 **Backend** → deploy lên **Render** qua Deploy Hook
- 🌐 **Frontend** → deploy lên **Vercel** qua Vercel CLI
- 🗄️ **Database** → **Railway** (MySQL), kết nối qua connection string trong Render environment variables

### GitHub Secrets cần thiết

| Secret | Mô tả |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Settings → Deploy Hook |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VITE_API_URL` | URL backend Render, ví dụ `https://interacthub.onrender.com` |

## Docker

- `InteractHub.API/Dockerfile` - multi-stage build for backend
- `interacthub-frontend/Dockerfile` - build frontend and serve via nginx
- `docker-compose.yml` - local compose for dev/test

## Next steps / Suggestions

- Add GitHub Secrets for Azure publish profile or Docker registry credentials if you want automatic deployment.
- Consider adding GitHub Actions to publish docker images to a registry and a deployment job for your chosen platform (AKS/ECS/Cloud Run).

## Project Structure

```
InteractHub/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
│
├── InteractHub.API/                        # ASP.NET Core Backend
│   ├── Constants/
│   │   └── ApiConstants.cs
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── BaseApiController.cs
│   │   ├── DevController.cs
│   │   ├── FollowController.cs
│   │   ├── FriendsController.cs
│   │   ├── HashtagsController.cs
│   │   ├── JobsController.cs
│   │   ├── MessagesController.cs
│   │   ├── NotificationsController.cs
│   │   ├── PostsController.cs
│   │   ├── ProfileController.cs
│   │   ├── ReportsController.cs
│   │   ├── StoriesController.cs
│   │   ├── UploadController.cs
│   │   └── UsersController.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── DTOs/
│   │   ├── Auth/
│   │   │   ├── AuthResponseDto.cs
│   │   │   ├── LoginDto.cs
│   │   │   └── RegisterDto.cs
│   │   ├── Comments/
│   │   │   └── CreateCommentDto.cs
│   │   ├── Common/
│   │   │   ├── ApiResponse.cs
│   │   │   └── ReportDto.cs
│   │   ├── Friends/
│   │   │   └── FriendDto.cs
│   │   ├── Post/
│   │   │   ├── CommentDto.cs
│   │   │   ├── CreatePostDto.cs
│   │   │   ├── PostResponseDto.cs
│   │   │   ├── SharedPostDto.cs
│   │   │   └── UpdatePostDto.cs
│   │   ├── Stories/
│   │   │   └── SendStoryMessageDto.cs
│   │   └── User/
│   │       ├── EducationDto.cs
│   │       ├── ExperienceDto.cs
│   │       ├── UpdateProfileDto.cs
│   │       └── UserProfileDto.cs
│   ├── Helpers/
│   │   └── LastActiveMiddleware.cs
│   ├── Migrations/
│   ├── Models/
│   │   └── Entities/
│   │       ├── AppUser.cs
│   │       ├── Comment.cs
│   │       ├── CommentReaction.cs
│   │       ├── Conversation.cs
│   │       ├── Education.cs
│   │       ├── Experience.cs
│   │       ├── Follow.cs
│   │       ├── Friendship.cs
│   │       ├── Hashtag.cs
│   │       ├── Job.cs
│   │       ├── JobApplication.cs
│   │       ├── Like.cs
│   │       ├── Message.cs
│   │       ├── Notification.cs
│   │       ├── Post.cs
│   │       ├── PostHashtag.cs
│   │       ├── PostReport.cs
│   │       ├── Report.cs
│   │       ├── ReportActionLog.cs
│   │       ├── Skill.cs
│   │       ├── Story.cs
│   │       └── StoryView.cs
│   ├── Repositories/
│   │   ├── Implementations/
│   │   └── Interfaces/
│   ├── Services/
│   │   ├── Implementations/
│   │   │   ├── AuthService.cs
│   │   │   ├── FriendService.cs
│   │   │   ├── NotificationService.cs
│   │   │   ├── PostService.cs
│   │   │   ├── UploadService.cs
│   │   │   └── UserService.cs
│   │   └── Interfaces/
│   │       ├── IAuthService.cs
│   │       ├── IFriendService.cs
│   │       ├── INotificationService.cs
│   │       ├── IPostService.cs
│   │       ├── IUploadService.cs
│   │       └── IUserService.cs
│   ├── Dockerfile
│   ├── Program.cs
│   ├── appsettings.json
│   └── appsettings.Development.json
│
├── InteractHub.Tests/                      # Unit Tests (xUnit)
│   ├── Services/
│   │   ├── FriendServiceTests.cs
│   │   ├── NotificationServiceTests.cs
│   │   └── PostServiceTests.cs
│   └── UnitTest1.cs
│
├── interacthub-frontend/                   # React + Vite Frontend
│   └── src/
│       ├── components/
│       │   ├── common/
│       │   │   ├── Avatar.tsx
│       │   │   ├── ConfirmModal.tsx
│       │   │   ├── DarkModeToggle.tsx
│       │   │   ├── LoadingSpinner.tsx
│       │   │   └── TrendingSidebar.tsx
│       │   ├── layout/
│       │   │   ├── MainLayout.tsx
│       │   │   └── Navbar.tsx
│       │   ├── post/
│       │   │   ├── CreatePostCard.tsx
│       │   │   ├── PostCard.tsx
│       │   │   └── StoriesBar.tsx
│       │   └── user/
│       │       └── ProfileCard.tsx
│       ├── config/
│       │   └── constants.ts
│       ├── hooks/
│       │   ├── useAuth.tsx
│       │   └── useUpload.ts
│       ├── pages/
│       │   ├── AdminReportsPage.tsx
│       │   ├── ArticleEditorPage.tsx
│       │   ├── FriendsPage.tsx
│       │   ├── HomePage.tsx
│       │   ├── JobsPage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── MessagingPage.tsx
│       │   ├── NotificationsPage.tsx
│       │   ├── PostDetailPage.tsx
│       │   ├── ProfilePage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── SavedPage.tsx
│       │   └── SearchPage.tsx
│       ├── services/
│       │   ├── api.ts
│       │   ├── authService.ts
│       │   ├── followService.ts
│       │   ├── friendService.ts
│       │   ├── hashtagService.ts
│       │   ├── jobService.ts
│       │   ├── jwt.ts
│       │   ├── messageService.ts
│       │   ├── notificationService.ts
│       │   ├── postService.ts
│       │   ├── profileService.ts
│       │   └── userService.ts
│       ├── types/
│       │   └── index.ts
│       ├── App.tsx
│       └── main.tsx
│
├── docker-compose.yml
├── InteractHub.slnx
└── README.md
```
