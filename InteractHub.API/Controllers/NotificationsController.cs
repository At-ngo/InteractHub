using InteractHub.API.Data;
using InteractHub.API.DTOs.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using InteractHub.API.Models.Entities;

namespace InteractHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = GetUserId();
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .Select(n => new
                {
                    n.Id,
                    n.Message,
                    n.Type,
                    n.IsRead,
                    n.CreatedAt,
                    n.RelatedEntityId
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(notifications));
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetUserId();
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy thông báo"));

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã đọc thông báo"));
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetUserId();
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            notifications.ForEach(n => n.IsRead = true);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã đọc tất cả thông báo"));
        }

        [HttpGet("unread-counts")]
        public async Task<IActionResult> GetUnreadCounts()
        {
            var userId = GetUserId();
            var counts = new
            {
                Messages = await _context.Messages.CountAsync(m => m.SenderId != userId && !m.IsRead && (
                    _context.Conversations.Any(c => c.Id == m.ConversationId && (c.User1Id == userId || c.User2Id == userId))
                )),
                Connections = await _context.Friendships.CountAsync(f => f.ReceiverId == userId && f.Status == Models.Entities.FriendshipStatus.Pending),
                Jobs = 0, // placeholder if job notifications implemented
                General = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead)
            };

            return Ok(ApiResponse<object>.Ok(counts));
        }

        [HttpPost("mention")]
        public async Task<IActionResult> MentionInStory([FromBody] MentionDto dto)
        {
            var userId = GetUserId();
            _context.Notifications.Add(new Notification
            {
                UserId = dto.MentionedUserId,
                Message = dto.Message,
                Type = "mention",
                RelatedEntityId = dto.StoryId.ToString()
            });
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã nhắc đến"));
        }

        public class MentionDto
        {
            public string MentionedUserId { get; set; } = string.Empty;
            public int StoryId { get; set; }
            public string Message { get; set; } = string.Empty;
        }
    }
}