namespace InteractHub.API.Models.Entities
{
    public class Report
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty; // post, comment, story, user
        public string EntityId { get; set; } = string.Empty; // id of the entity being reported
        public string Reason { get; set; } = string.Empty;
        public bool IsResolved { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string ReporterId { get; set; } = string.Empty;
        public AppUser Reporter { get; set; } = null!;
        
        // Report actions are stored in separate entity ReportActionLog
    }
}
