namespace InteractHub.API.Models.Entities
{
    public class Experience
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string? Location { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrentJob { get; set; } = false;
        public string? Description { get; set; }

        public string UserId { get; set; } = string.Empty;
        public AppUser User { get; set; } = null!;
    }
}