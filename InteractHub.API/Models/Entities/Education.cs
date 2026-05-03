namespace InteractHub.API.Models.Entities
{
    public class Education
    {
        public int Id { get; set; }
        public string School { get; set; } = string.Empty;
        public string Degree { get; set; } = string.Empty;
        public string? FieldOfStudy { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Description { get; set; }

        public string UserId { get; set; } = string.Empty;
        public AppUser User { get; set; } = null!;
    }
}