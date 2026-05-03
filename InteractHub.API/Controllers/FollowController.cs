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
    public class FollowController : ControllerBase
    {
        private readonly AppDbContext _context;
        public FollowController(AppDbContext context) { _context = context; }
        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpPost("{targetId}")]
        public async Task<IActionResult> ToggleFollow(string targetId)
        {
            var userId = GetUserId();
            if (userId == targetId)
                return BadRequest(ApiResponse<string>.Fail("Không thể tự theo dõi"));

            var existing = await _context.Follows
                .FirstOrDefaultAsync(f => f.FollowerId == userId && f.FollowingId == targetId);

            if (existing != null)
            {
                _context.Follows.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(ApiResponse<string>.Ok("Đã bỏ theo dõi"));
            }

            _context.Follows.Add(new Follow
            {
                FollowerId = userId,
                FollowingId = targetId
            });

            // Notification
            var follower = await _context.Users.FindAsync(userId);
            _context.Notifications.Add(new Notification
            {
                UserId = targetId,
                Message = $"{follower!.FullName} đã theo dõi bạn",
                Type = "follow",
                RelatedEntityId = userId
            });

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã theo dõi"));
        }

        [HttpGet("{targetId}/status")]
        public async Task<IActionResult> GetFollowStatus(string targetId)
        {
            var userId = GetUserId();
            var isFollowing = await _context.Follows
                .AnyAsync(f => f.FollowerId == userId && f.FollowingId == targetId);
            return Ok(ApiResponse<bool>.Ok(isFollowing));
        }
    }
}