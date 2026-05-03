namespace InteractHub.API.Services.Interfaces
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(string userId, string message, string type, string? relatedEntityId = null);
        Task<List<object>> GetNotificationsAsync(string userId);
        Task<(bool Success, string Message)> MarkAsReadAsync(int id, string userId);
        Task MarkAllAsReadAsync(string userId);
    }
}