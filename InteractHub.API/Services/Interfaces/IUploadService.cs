namespace InteractHub.API.Services.Interfaces
{
    public interface IUploadService
    {
        Task<string> UploadImageAsync(IFormFile file, string folder = "posts");
        Task<string> UploadVideoAsync(IFormFile file, string folder = "videos");
        Task<bool> DeleteImageAsync(string publicId);
    }
}