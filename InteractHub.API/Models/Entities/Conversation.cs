namespace InteractHub.API.Models.Entities
{
    public class Conversation
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public string User1Id { get; set; } = string.Empty;
        public string User2Id { get; set; } = string.Empty;
        public AppUser User1 { get; set; } = null!;
        public AppUser User2 { get; set; } = null!;
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}