using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

// Allow conditional validation: content can be empty when SharedPostId is provided (a repost without extra text)
using System.Linq;

namespace InteractHub.API.DTOs.Post
{
    public class CreatePostDto : IValidatableObject
    {
        // Content is optional when SharedPostId is provided (repost without text)
        [StringLength(2000, MinimumLength = 0)]
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        // Optional id of the post being shared (repost)
        public int? SharedPostId { get; set; }
        public List<string> Hashtags { get; set; } = new List<string>();

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // If this is not a repost (SharedPostId is null), require non-empty content
            if (SharedPostId == null && string.IsNullOrWhiteSpace(Content))
            {
                yield return new ValidationResult("Nội dung bài viết không được để trống.", new[] { nameof(Content) });
            }

            // If content provided, ensure it meets length constraints
            if (!string.IsNullOrWhiteSpace(Content) && Content.Length > 2000)
            {
                yield return new ValidationResult("Nội dung không được vượt quá 2000 ký tự.", new[] { nameof(Content) });
            }
        }
    }
}