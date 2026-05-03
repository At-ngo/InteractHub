using InteractHub.API.Data;
using InteractHub.API.DTOs.Common;
using InteractHub.API.DTOs.Stories;
using InteractHub.API.Constants;
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
    public class StoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StoriesController(AppDbContext context)
        {
            _context = context;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpGet]
        public async Task<IActionResult> GetStories()
        {
            var userId = GetUserId();
            var stories = await _context.Stories
                .Where(s => s.ExpiresAt > DateTime.UtcNow)
                .Include(s => s.User)
                .Include(s => s.Views)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.ImageUrl,
                    s.TextContent,
                    s.CreatedAt,
                    s.ExpiresAt,
                    s.UserId,
                    Username = s.User.UserName,
                    s.User.FullName,
                    s.User.AvatarUrl,
                    ViewsCount = s.Views.Count,
                    HasViewed = s.Views.Any(v => v.ViewerId == userId)
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(stories));
        }

        [HttpPost]
        public async Task<IActionResult> CreateStory([FromBody] CreateStoryDto dto)
        {
            var userId = GetUserId();
            var story = new Story
            {
                ImageUrl = dto.ImageUrl,
                TextContent = dto.TextContent,
                Background = dto.Background,
                UserId = userId
            };

            _context.Stories.Add(story);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã tạo story"));
        }

        // Xem story (track view)
        [HttpPost("{id}/view")]
        public async Task<IActionResult> ViewStory(int id)
        {
            var userId = GetUserId();
            var existing = await _context.StoryViews
                .FirstOrDefaultAsync(v => v.StoryId == id && v.ViewerId == userId);

            if (existing == null)
            {
                _context.StoryViews.Add(new StoryView
                {
                    StoryId = id,
                    ViewerId = userId
                });
                await _context.SaveChangesAsync();
            }
            return Ok(ApiResponse<string>.Ok("OK"));
        }

        // Thả cảm xúc story
        [HttpPost("{id}/react")]
        public async Task<IActionResult> ReactStory(int id, [FromBody] StoryReactDto dto)
        {
            var userId = GetUserId();
            var view = await _context.StoryViews
                .FirstOrDefaultAsync(v => v.StoryId == id && v.ViewerId == userId);

            if (view == null)
            {
                _context.StoryViews.Add(new StoryView
                {
                    StoryId = id,
                    ViewerId = userId,
                    ReactionType = dto.ReactionType
                });
            }
            else
            {
                view.ReactionType = view.ReactionType == dto.ReactionType ? null : dto.ReactionType;
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("OK"));
        }

        // Lấy danh sách người đã xem (chỉ chủ story)
        [HttpGet("{id}/views")]
        public async Task<IActionResult> GetViews(int id)
        {
            var userId = GetUserId();
            var story = await _context.Stories.FindAsync(id);

            if (story == null || story.UserId != userId)
                return Forbid();

            var views = await _context.StoryViews
                .Where(v => v.StoryId == id)
                .Include(v => v.Viewer)
                .OrderByDescending(v => v.ViewedAt)
                .Select(v => new
                {
                    v.ViewerId,
                    v.Viewer.FullName,
                    v.Viewer.AvatarUrl,
                    v.ReactionType,
                    v.ViewedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(views));
        }

        // Gửi message tới chủ story (tạo/điền conversation nếu cần)
        [HttpPost("{id}/message")]
        public async Task<IActionResult> SendMessageToStory(int id, [FromBody] SendStoryMessageDto dto)
        {
            var userId = GetUserId();
            var story = await _context.Stories.FindAsync(id);
            if (story == null)
                return NotFound(ApiResponse<string>.Fail(ApiConstants.ResourceNotFoundMessage));

            if (story.UserId == userId)
                return BadRequest(ApiResponse<string>.Fail("Không thể nhắn cho chính mình"));

            // Tìm hoặc tạo conversation giữa 2 user
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => (c.User1Id == userId && c.User2Id == story.UserId) || (c.User1Id == story.UserId && c.User2Id == userId));

            if (conversation == null)
            {
                conversation = new Models.Entities.Conversation
                {
                    User1Id = userId,
                    User2Id = story.UserId
                };
                _context.Conversations.Add(conversation);
                await _context.SaveChangesAsync();
            }

            var message = new Models.Entities.Message
            {
                Content = dto.Content,
                SenderId = userId,
                ConversationId = conversation.Id
            };

            _context.Messages.Add(message);

            // Thông báo cho chủ story kèm id story để front-end mở
            _context.Notifications.Add(new Models.Entities.Notification
            {
                UserId = story.UserId,
                Message = $"Bạn có một tin nhắn mới từ {User?.Identity?.Name ?? "ai đó"}",
                Type = "message",
                RelatedEntityId = id.ToString()
            });

            conversation.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(new
            {
                conversationId = conversation.Id,
                messageId = message.Id,
                message.Content,
                RelatedStoryId = id
            }));
        }

        public class StoryReactDto
        {
            public string ReactionType { get; set; } = string.Empty;
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStory(int id)
        {
            var userId = GetUserId();
            var story = await _context.Stories
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (story == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy story"));

            _context.Stories.Remove(story);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã xóa story"));
        }
    }

    public class CreateStoryDto
    {
        public string? ImageUrl { get; set; }
        public string? TextContent { get; set; }
        public string? Background { get; set; }
    }
}