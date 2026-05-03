using System.ComponentModel.DataAnnotations;

namespace InteractHub.API.DTOs.Comments;

public class CreateCommentDto
{
    [Required, StringLength(1000)]
    public string Content { get; set; } = "";
}

public class CommentResponseDto
{
    public int Id { get; set; }
    public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string AuthorId { get; set; } = "";
    public string AuthorUsername { get; set; } = "";
    public string? AuthorAvatarUrl { get; set; }
}