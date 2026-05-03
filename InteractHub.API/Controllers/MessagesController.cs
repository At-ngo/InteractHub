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
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public MessagesController(AppDbContext context) { _context = context; }
        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        // Lấy danh sách conversations
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var userId = GetUserId();
            var conversations = await _context.Conversations
                .Where(c => c.User1Id == userId || c.User2Id == userId)
                .Include(c => c.User1)
                .Include(c => c.User2)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new
                {
                    c.Id,
                    OtherUser = c.User1Id == userId
                        ? new { c.User2.Id, c.User2.FullName, c.User2.AvatarUrl, c.User2.UserName }
                        : new { c.User1.Id, c.User1.FullName, c.User1.AvatarUrl, c.User1.UserName },
                    LastMessage = c.Messages.OrderByDescending(m => m.CreatedAt)
                        .Select(m => new { m.Content, m.CreatedAt, m.IsRead, m.SenderId })
                        .FirstOrDefault(),
                    UnreadCount = c.Messages.Count(m => !m.IsRead && m.SenderId != userId)
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(conversations));
        }

        // Lấy hoặc tạo conversation với user khác
        [HttpPost("conversations/{otherUserId}")]
        public async Task<IActionResult> GetOrCreateConversation(string otherUserId)
        {
            var userId = GetUserId();
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c =>
                    (c.User1Id == userId && c.User2Id == otherUserId) ||
                    (c.User1Id == otherUserId && c.User2Id == userId));

            if (conversation == null)
            {
                conversation = new Conversation
                {
                    User1Id = userId,
                    User2Id = otherUserId
                };
                _context.Conversations.Add(conversation);
                await _context.SaveChangesAsync();
            }

            return Ok(ApiResponse<object>.Ok(new { conversation.Id }));
        }

        // Lấy messages của conversation
        [HttpGet("conversations/{conversationId}/messages")]
        public async Task<IActionResult> GetMessages(int conversationId, [FromQuery] int page = 1)
        {
            var userId = GetUserId();
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.Id == conversationId &&
                    (c.User1Id == userId || c.User2Id == userId));

            if (conversation == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy cuộc trò chuyện"));

            var messages = await _context.Messages
                .Where(m => m.ConversationId == conversationId)
                .Include(m => m.Sender)
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * 20)
                .Take(20)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.CreatedAt,
                    m.IsRead,
                    m.SenderId,
                    SenderName = m.Sender.FullName,
                    SenderAvatar = m.Sender.AvatarUrl
                })
                .ToListAsync();

            // Đánh dấu đã đọc
            var unread = await _context.Messages
                .Where(m => m.ConversationId == conversationId &&
                    m.SenderId != userId && !m.IsRead)
                .ToListAsync();
            unread.ForEach(m => m.IsRead = true);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(messages.OrderBy(m => m.CreatedAt)));
        }

        // Gửi message
        [HttpPost("conversations/{conversationId}/messages")]
        public async Task<IActionResult> SendMessage(int conversationId, [FromBody] SendMessageDto dto)
        {
            var userId = GetUserId();
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.Id == conversationId &&
                    (c.User1Id == userId || c.User2Id == userId));

            if (conversation == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy cuộc trò chuyện"));

            var message = new Message
            {
                Content = dto.Content,
                SenderId = userId,
                ConversationId = conversationId
            };

            _context.Messages.Add(message);
            conversation.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(new
            {
                message.Id,
                message.Content,
                message.CreatedAt,
                message.SenderId
            }));
        }
    }

    public class SendMessageDto
    {
        public string Content { get; set; } = string.Empty;
    }
}