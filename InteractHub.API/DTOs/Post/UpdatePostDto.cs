using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.DTOs.Post
{
    public class UpdatePostDto
    {
        [StringLength(2000, MinimumLength = 0)]
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }
}