namespace InteractHub.API.Models.Entities
{
    public class StoryView
    {
        public int Id { get; set; }
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
        public string? ReactionType { get; set; }

        public int StoryId { get; set; }
        public string ViewerId { get; set; } = string.Empty;
        public Story Story { get; set; } = null!;
        public AppUser Viewer { get; set; } = null!;
    }
}