namespace InteractHub.API.Models.Entities
{
    public class Story
    {
        public int Id { get; set; }
        public string? ImageUrl { get; set; }
        public string? TextContent { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
        public bool IsActive => DateTime.UtcNow < ExpiresAt;
        public string? Background { get; set; }

        public string UserId { get; set; } = string.Empty;
        public AppUser User { get; set; } = null!;
        public ICollection<StoryView> Views { get; set; } = new List<StoryView>();
    }
}