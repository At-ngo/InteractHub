namespace InteractHub.API.Models.Entities
{
    public class CommentReaction
    {
        public int Id { get; set; }
        public string ReactionType { get; set; } = "like";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int CommentId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public Comment Comment { get; set; } = null!;
        public AppUser User { get; set; } = null!;
    }
}