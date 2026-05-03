using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.DTOs.User
{
    public class CreateExperienceDto
    {
        [Required] public string Title { get; set; } = string.Empty;
        [Required] public string Company { get; set; } = string.Empty;
        public string? Location { get; set; }
        [Required] public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrentJob { get; set; }
        public string? Description { get; set; }
    }

    public class ExperienceResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string? Location { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrentJob { get; set; }
        public string? Description { get; set; }
    }
}