using InteractHub.API.Data;
using InteractHub.API.DTOs.User;
using InteractHub.API.Models.Entities;
using InteractHub.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.API.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserProfileDto?> GetProfileAsync(string userId)
        {
            var user = await _context.Users
                .Include(u => u.Posts)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            var friendCount = await _context.Friendships
                .CountAsync(f => (f.SenderId == userId || f.ReceiverId == userId)
                    && f.Status == FriendshipStatus.Accepted);

            return new UserProfileDto
            {
                Id = user.Id,
                Username = user.UserName!,
                Email = user.Email!,
                FullName = user.FullName,
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl,
                CoverUrl = user.CoverUrl,
                CreatedAt = user.CreatedAt,
                PostCount = user.Posts.Count(p => !p.IsDeleted),
                FriendCount = friendCount
            };
        }

        public async Task<(bool Success, string Message)> UpdateProfileAsync(string userId, UpdateProfileDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return (false, "Không tìm thấy user");

            user.FullName = dto.FullName;
            user.Bio = dto.Bio;
            if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;
            if (dto.CoverUrl != null) user.CoverUrl = dto.CoverUrl;

            await _context.SaveChangesAsync();
            return (true, "Cập nhật thành công");
        }

        public async Task<List<UserProfileDto>> SearchUsersAsync(string query)
        {
            return await _context.Users
                .Where(u => u.UserName!.Contains(query) || u.FullName.Contains(query))
                .Take(20)
                .Select(u => new UserProfileDto
                {
                    Id = u.Id,
                    Username = u.UserName!,
                    FullName = u.FullName,
                    AvatarUrl = u.AvatarUrl
                })
                .ToListAsync();
        }
    }
}