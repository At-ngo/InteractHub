namespace InteractHub.API.Models.Entities
{
    public class PostReport
    {
        public int Id { get; set; }
        public string Reason { get; set; } = string.Empty;
        public bool IsResolved { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int PostId { get; set; }
        public string ReporterId { get; set; } = string.Empty;
        public Post Post { get; set; } = null!;
        public AppUser Reporter { get; set; } = null!;
    }
}