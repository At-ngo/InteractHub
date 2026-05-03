using InteractHub.API.DTOs.Auth;

namespace InteractHub.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(RegisterDto dto);
        Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(LoginDto dto);
    }
}