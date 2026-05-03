namespace InteractHub.API.Models.Entities
{
    public class Message
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;

        public int ConversationId { get; set; }
        public string SenderId { get; set; } = string.Empty;
        public Conversation Conversation { get; set; } = null!;
        public AppUser Sender { get; set; } = null!;
    }
}