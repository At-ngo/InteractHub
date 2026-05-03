using System;

namespace InteractHub.API.Constants
{
    public static class ApiConstants
    {
        // Jwt
        public const int JwtExpiryDays = 7;

        // Pagination
        public const int DefaultPage = 1;
        public const int DefaultPageSize = 10;

        // Upload limits (bytes)
        public const int MaxImageBytes = 5 * 1024 * 1024; // 5 MB
        public const int MaxVideoBytes = 50 * 1024 * 1024; // 50 MB

        // Defaults
        public const string DefaultUserRole = "User";
        public const string DefaultReaction = "like";

        // Notification types
        public const string NotificationSaved = "saved";
        public const string NotificationLike = "like";
        public const string NotificationComment = "comment";
        public const string NotificationCommentReply = "comment_reply";
        public const string NotificationCommentReaction = "comment_reaction";

        // Messages
        public const string InvalidModelMessage = "Dữ liệu không hợp lệ";
        public const string ResourceNotFoundMessage = "Không tìm thấy tài nguyên";

        // Allowed mime types
        public static readonly string[] AllowedImageTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        public static readonly string[] AllowedVideoTypes = new[] { "video/mp4", "video/mpeg", "video/quicktime", "video/webm" };
    }
}
