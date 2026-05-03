namespace InteractHub.API.Models.Entities
{
    public class Like
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string UserId { get; set; } = string.Empty;
        public int PostId { get; set; }
        public AppUser User { get; set; } = null!;
        public Post Post { get; set; } = null!;
        public string ReactionType { get; set; } = "like"; // like, celebrate, support, love, insightful, funny
    }
}