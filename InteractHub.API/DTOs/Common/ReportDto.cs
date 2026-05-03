using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.DTOs.Common
{
    public class ReportDto
    {
        [Required]
        public string Type { get; set; } = string.Empty; // post, comment, story, user

        [Required]
        public string EntityId { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Reason { get; set; } = string.Empty;
    }

    public class ReportAppealDto
    {
        [Required]
        [StringLength(1000)]
        public string Reason { get; set; } = string.Empty;
    }

    public class ResolveAppealDto
    {
        public bool Approve { get; set; }
    }
}
