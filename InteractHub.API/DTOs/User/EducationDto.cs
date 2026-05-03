using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.DTOs.User
{
    public class CreateEducationDto
    {
        [Required] public string School { get; set; } = string.Empty;
        [Required] public string Degree { get; set; } = string.Empty;
        public string? FieldOfStudy { get; set; }
        [Required] public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Description { get; set; }
    }

    public class EducationResponseDto
    {
        public int Id { get; set; }
        public string School { get; set; } = string.Empty;
        public string Degree { get; set; } = string.Empty;
        public string? FieldOfStudy { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Description { get; set; }
    }
}