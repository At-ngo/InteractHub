namespace InteractHub.API.Models.Entities
{
    public class Comment
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public string UserId { get; set; } = string.Empty;
        public int PostId { get; set; }
        public AppUser User { get; set; } = null!;
        public Post Post { get; set; } = null!;
        public int? ParentCommentId { get; set; }
        public Comment? ParentComment { get; set; }
        public ICollection<Comment> Replies { get; set; } = new List<Comment>();
        public ICollection<CommentReaction> Reactions { get; set; } = new List<CommentReaction>();
    }
}