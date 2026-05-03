namespace InteractHub.API.Services.Interfaces
{
    public interface IFriendService
    {
        Task<(bool Success, string Message)> SendRequestAsync(string senderId, string receiverId);
        Task<(bool Success, string Message)> AcceptRequestAsync(string senderId, string receiverId);
        Task<(bool Success, string Message)> RejectRequestAsync(string senderId, string receiverId);
        Task<List<object>> GetFriendsAsync(string userId);
        Task<List<object>> GetPendingRequestsAsync(string userId);
    }
}