using InteractHub.API.DTOs.User;

namespace InteractHub.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<UserProfileDto?> GetProfileAsync(string userId);
        Task<(bool Success, string Message)> UpdateProfileAsync(string userId, UpdateProfileDto dto);
        Task<List<UserProfileDto>> SearchUsersAsync(string query);
    }
}