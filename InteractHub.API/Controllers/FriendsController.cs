using InteractHub.API.Data;
using InteractHub.API.DTOs.Common;
using InteractHub.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace InteractHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FriendsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FriendsController(AppDbContext context)
        {
            _context = context;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpPost("request/{receiverId}")]
        public async Task<IActionResult> SendRequest(string receiverId)
        {
            var senderId = GetUserId();
            if (senderId == receiverId)
                return BadRequest(ApiResponse<string>.Fail("Không thể kết bạn với chính mình"));

            var existing = await _context.Friendships.FirstOrDefaultAsync(f =>
                (f.SenderId == senderId && f.ReceiverId == receiverId) ||
                (f.SenderId == receiverId && f.ReceiverId == senderId));

            if (existing != null)
                return BadRequest(ApiResponse<string>.Fail("Đã gửi lời mời hoặc đã là bạn bè"));

            _context.Friendships.Add(new Friendship
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Status = FriendshipStatus.Pending
            });

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã gửi lời mời kết bạn"));
        }

        [HttpPut("accept/{senderId}")]
        public async Task<IActionResult> AcceptRequest(string senderId)
        {
            var userId = GetUserId();
            var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
                f.SenderId == senderId && f.ReceiverId == userId && f.Status == FriendshipStatus.Pending);

            if (friendship == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy lời mời kết bạn"));

            friendship.Status = FriendshipStatus.Accepted;
            friendship.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã chấp nhận lời mời kết bạn"));
        }

        [HttpPut("reject/{senderId}")]
        public async Task<IActionResult> RejectRequest(string senderId)
        {
            var userId = GetUserId();
            var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
                f.SenderId == senderId && f.ReceiverId == userId && f.Status == FriendshipStatus.Pending);

            if (friendship == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy lời mời kết bạn"));

            friendship.Status = FriendshipStatus.Rejected;
            friendship.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã từ chối lời mời kết bạn"));
        }

        [HttpGet]
        public async Task<IActionResult> GetFriends()
        {
            var userId = GetUserId();
            var friends = await _context.Friendships
                .Where(f => (f.SenderId == userId || f.ReceiverId == userId)
                    && f.Status == FriendshipStatus.Accepted)
                .Include(f => f.Sender)
                .Include(f => f.Receiver)
                .Select(f => f.SenderId == userId ? f.Receiver : f.Sender)
                .Select(u => new { u.Id, u.UserName, u.FullName, u.AvatarUrl })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(friends));
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var userId = GetUserId();
            var requests = await _context.Friendships
                .Where(f => f.ReceiverId == userId && f.Status == FriendshipStatus.Pending)
                .Include(f => f.Sender)
                .Select(f => new
                {
                    FriendshipId = f.Id,
                    SenderId = f.Sender.Id,
                    f.Sender.UserName,
                    f.Sender.FullName,
                    f.Sender.AvatarUrl,
                    f.CreatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(requests));
        }

        [HttpGet("sent")]
        public async Task<IActionResult> GetSentRequests()
        {
            var userId = GetUserId();
            var requests = await _context.Friendships
                .Where(f => f.SenderId == userId && f.Status == FriendshipStatus.Pending)
                .Include(f => f.Receiver)
                .Select(f => new
                {
                    ReceiverId = f.Receiver.Id,
                    f.Receiver.UserName,
                    f.Receiver.FullName,
                    f.Receiver.AvatarUrl,
                    f.CreatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(requests));
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var userId = GetUserId();

            var connected = await _context.Friendships
                .CountAsync(f => (f.SenderId == userId || f.ReceiverId == userId)
                    && f.Status == FriendshipStatus.Accepted);

            var sentRequests = await _context.Friendships
                .CountAsync(f => f.SenderId == userId && f.Status == FriendshipStatus.Pending);

            var followers = await _context.Follows
                .CountAsync(f => f.FollowingId == userId);

            var following = await _context.Follows
                .CountAsync(f => f.FollowerId == userId);

            return Ok(ApiResponse<object>.Ok(new
            {
                connected,
                sentRequests,
                followers,
                following
            }));
        }

        // Hủy kết nối
        [HttpDelete("unfriend/{friendId}")]
        public async Task<IActionResult> Unfriend(string friendId)
        {
            var userId = GetUserId();
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f =>
                    (f.SenderId == userId && f.ReceiverId == friendId ||
                    f.SenderId == friendId && f.ReceiverId == userId) &&
                    f.Status == FriendshipStatus.Accepted);

            if (friendship == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy kết nối"));

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã hủy kết nối"));
        }

        // Thu hồi lời mời
        [HttpDelete("cancel/{receiverId}")]
        public async Task<IActionResult> CancelRequest(string receiverId)
        {
            var userId = GetUserId();
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.SenderId == userId &&
                    f.ReceiverId == receiverId &&
                    f.Status == FriendshipStatus.Pending);

            if (friendship == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy lời mời"));

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã thu hồi lời mời"));
        }

        // Kiểm tra trạng thái kết nối
        [HttpGet("status/{targetId}")]
        public async Task<IActionResult> GetFriendshipStatus(string targetId)
        {
            var userId = GetUserId();
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f =>
                    (f.SenderId == userId && f.ReceiverId == targetId) ||
                    (f.SenderId == targetId && f.ReceiverId == userId));

            if (friendship == null)
                return Ok(ApiResponse<object>.Ok(new { status = "none" }));

            return Ok(ApiResponse<object>.Ok(new
            {
                status = friendship.Status.ToString().ToLower(),
                isSender = friendship.SenderId == userId,
                friendshipId = friendship.Id
            }));
        }

    }
}