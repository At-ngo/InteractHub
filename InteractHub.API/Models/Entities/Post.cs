namespace InteractHub.API.Models.Entities
{
    public class Post
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
        public string CommentPermission { get; set; } = "everyone"; // everyone, connections, none

        public string UserId { get; set; } = string.Empty;
        public AppUser User { get; set; } = null!;
        // Optional reference to an original/shared post (repost/share)
        public int? SharedPostId { get; set; }
        public Post? SharedPost { get; set; }
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Like> Likes { get; set; } = new List<Like>();
        public ICollection<PostHashtag> PostHashtags { get; set; } = new List<PostHashtag>();
        public ICollection<PostReport> Reports { get; set; } = new List<PostReport>();
    }
}