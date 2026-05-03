using InteractHub.API.DTOs.Post;

namespace InteractHub.API.Services.Interfaces
{
    public interface IPostService
    {
        Task<List<PostResponseDto>> GetPostsAsync(int page, int pageSize, string currentUserId);
        Task<PostResponseDto?> GetPostByIdAsync(int id, string currentUserId);
        Task<(bool Success, string Message)> CreatePostAsync(CreatePostDto dto, string userId);
        Task<(bool Success, string Message)> UpdatePostAsync(int id, UpdatePostDto dto, string userId);
        Task<(bool Success, string Message)> DeletePostAsync(int id, string userId);
        Task<(bool Success, string Message)> ToggleLikeAsync(int postId, string userId);
    }
}