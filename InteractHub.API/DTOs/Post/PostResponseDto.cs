namespace InteractHub.API.DTOs.Post
{
    public class PostResponseDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
        public List<string> Hashtags { get; set; } = new List<string>();
        public string CommentPermission { get; set; } = "everyone";
        public bool IsSaved { get; set; } = false;
        // If this post is a share/repost, the original post metadata is here
        public bool IsShare { get; set; } = false;
        public SharedPostDto? SharedPost { get; set; }
    }
}