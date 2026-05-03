using InteractHub.API.Data;
using InteractHub.API.Models.Entities;
using InteractHub.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.API.Services.Implementations
{
    public class FriendService : IFriendService
    {
        private readonly AppDbContext _context;

        public FriendService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message)> SendRequestAsync(string senderId, string receiverId)
        {
            if (senderId == receiverId)
                return (false, "Không thể kết bạn với chính mình");

            var existing = await _context.Friendships.FirstOrDefaultAsync(f =>
                (f.SenderId == senderId && f.ReceiverId == receiverId) ||
                (f.SenderId == receiverId && f.ReceiverId == senderId));

            if (existing != null)
                return (false, "Đã gửi lời mời hoặc đã là bạn bè");

            _context.Friendships.Add(new Friendship
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Status = FriendshipStatus.Pending
            });

            await _context.SaveChangesAsync();
            return (true, "Đã gửi lời mời kết bạn");
        }

        public async Task<(bool Success, string Message)> AcceptRequestAsync(string senderId, string receiverId)
        {
            var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
                f.SenderId == senderId && f.ReceiverId == receiverId &&
                f.Status == FriendshipStatus.Pending);

            if (friendship == null)
                return (false, "Không tìm thấy lời mời kết bạn");

            friendship.Status = FriendshipStatus.Accepted;
            friendship.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Đã chấp nhận lời mời");
        }

        public async Task<(bool Success, string Message)> RejectRequestAsync(string senderId, string receiverId)
        {
            var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
                f.SenderId == senderId && f.ReceiverId == receiverId &&
                f.Status == FriendshipStatus.Pending);

            if (friendship == null)
                return (false, "Không tìm thấy lời mời kết bạn");

            friendship.Status = FriendshipStatus.Rejected;
            friendship.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Đã từ chối lời mời");
        }

        public async Task<List<object>> GetFriendsAsync(string userId)
        {
            var friends = await _context.Friendships
                .Where(f => (f.SenderId == userId || f.ReceiverId == userId)
                    && f.Status == FriendshipStatus.Accepted)
                .Include(f => f.Sender)
                .Include(f => f.Receiver)
                .ToListAsync();

            return friends.Select(f =>
            {
                var friend = f.SenderId == userId ? f.Receiver : f.Sender;
                return (object)new
                {
                    friend.Id,
                    friend.UserName,
                    friend.FullName,
                    friend.AvatarUrl
                };
            }).ToList();
        }

        public async Task<List<object>> GetPendingRequestsAsync(string userId)
        {
            return await _context.Friendships
                .Where(f => f.ReceiverId == userId && f.Status == FriendshipStatus.Pending)
                .Include(f => f.Sender)
                .Select(f => (object)new
                {
                    FriendshipId = f.Id,
                    SenderId = f.Sender.Id,
                    f.Sender.UserName,
                    f.Sender.FullName,
                    f.Sender.AvatarUrl,
                    f.CreatedAt
                })
                .ToListAsync();
        }
    }
}