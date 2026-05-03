using InteractHub.API.Data;
using InteractHub.API.DTOs.Common;
using InteractHub.API.DTOs.User;
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
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetUserId();
            var user = await _context.Users
                .Include(u => u.Posts)
                .Include(u => u.Experiences)
                .Include(u => u.Educations)
                .Include(u => u.Skills)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy user"));

            var friendCount = await _context.Friendships
                .CountAsync(f => (f.SenderId == userId || f.ReceiverId == userId)
                    && f.Status == Models.Entities.FriendshipStatus.Accepted);

            var result = new UserProfileDto
            {
                Id = user.Id,
                Username = user.UserName!,
                Email = user.Email!,
                FullName = user.FullName,
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl,
                CoverUrl = user.CoverUrl,
                JobTitle = user.JobTitle,
                Company = user.Company,
                Location = user.Location,
                CreatedAt = user.CreatedAt,
                PostCount = user.Posts.Count(p => !p.IsDeleted),
                FriendCount = friendCount,
                Experiences = user.Experiences.OrderByDescending(e => e.StartDate)
                    .Select(e => new ExperienceResponseDto
                    {
                        Id = e.Id, Title = e.Title, Company = e.Company,
                        Location = e.Location, StartDate = e.StartDate,
                        EndDate = e.EndDate, IsCurrentJob = e.IsCurrentJob,
                        Description = e.Description
                    }).ToList(),
                Educations = user.Educations.OrderByDescending(e => e.StartDate)
                    .Select(e => new EducationResponseDto
                    {
                        Id = e.Id, School = e.School, Degree = e.Degree,
                        FieldOfStudy = e.FieldOfStudy, StartDate = e.StartDate,
                        EndDate = e.EndDate, Description = e.Description
                    }).ToList(),
                Skills = user.Skills.Select(s => s.Name).ToList(),
                FollowerCount = await _context.Follows.CountAsync(f => f.FollowingId == userId),
                FollowingCount = await _context.Follows.CountAsync(f => f.FollowerId == userId),
                GitHubUrl = user.GitHubUrl,
                WebsiteUrl = user.WebsiteUrl,
                LinkedInUrl = user.LinkedInUrl,
                IsFollowing = false,
                IsConnected = false,
                LastActiveAt = user.LastActiveAt,
            };

            return Ok(ApiResponse<UserProfileDto>.Ok(result));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfile(string id)
        {
            var user = await _context.Users
                .Include(u => u.Posts)
                .Include(u => u.Experiences)
                .Include(u => u.Educations)
                .Include(u => u.Skills)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy user"));

            var currentUserId = GetUserId();

            var friendCount = await _context.Friendships
                .CountAsync(f => (f.SenderId == id || f.ReceiverId == id)
                    && f.Status == Models.Entities.FriendshipStatus.Accepted);

            var result = new UserProfileDto
            {
                Id = user.Id,
                Username = user.UserName!,
                Email = user.Email!,
                FullName = user.FullName,
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl,
                CoverUrl = user.CoverUrl,
                JobTitle = user.JobTitle,
                Company = user.Company,
                Location = user.Location,
                CreatedAt = user.CreatedAt,
                PostCount = user.Posts.Count(p => !p.IsDeleted),
                FriendCount = friendCount,
                Experiences = user.Experiences.OrderByDescending(e => e.StartDate)
                    .Select(e => new ExperienceResponseDto
                    {
                        Id = e.Id, Title = e.Title, Company = e.Company,
                        Location = e.Location, StartDate = e.StartDate,
                        EndDate = e.EndDate, IsCurrentJob = e.IsCurrentJob,
                        Description = e.Description
                    }).ToList(),
                Educations = user.Educations.OrderByDescending(e => e.StartDate)
                    .Select(e => new EducationResponseDto
                    {
                        Id = e.Id, School = e.School, Degree = e.Degree,
                        FieldOfStudy = e.FieldOfStudy, StartDate = e.StartDate,
                        EndDate = e.EndDate, Description = e.Description
                    }).ToList(),
                Skills = user.Skills.Select(s => s.Name).ToList(),
                GitHubUrl = user.GitHubUrl,
                WebsiteUrl = user.WebsiteUrl,
                LinkedInUrl = user.LinkedInUrl,
                FollowerCount = await _context.Follows.CountAsync(f => f.FollowingId == id),
                FollowingCount = await _context.Follows.CountAsync(f => f.FollowerId == id),
                IsFollowing = await _context.Follows
                    .AnyAsync(f => f.FollowerId == currentUserId && f.FollowingId == id),
                IsConnected = await _context.Friendships
                    .AnyAsync(f => (f.SenderId == currentUserId && f.ReceiverId == id ||
                                    f.SenderId == id && f.ReceiverId == currentUserId) &&
                                    f.Status == Models.Entities.FriendshipStatus.Accepted),
                LastActiveAt = user.LastActiveAt,
            };

            return Ok(ApiResponse<UserProfileDto>.Ok(result));
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy user"));

            user.FullName = dto.FullName;
            user.Bio = dto.Bio;
            if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;
            if (dto.CoverUrl != null) user.CoverUrl = dto.CoverUrl;
            user.JobTitle = dto.JobTitle;
            user.Company = dto.Company;
            user.Location = dto.Location;
            user.GitHubUrl = dto.GitHubUrl;
            user.WebsiteUrl = dto.WebsiteUrl;
            user.LinkedInUrl = dto.LinkedInUrl;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Cập nhật profile thành công"));
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string? q)
        {
            var currentUserId = GetUserId();

            // Lấy danh sách đã kết nối
            var connectedIds = await _context.Friendships
                .Where(f => (f.SenderId == currentUserId || f.ReceiverId == currentUserId)
                    && f.Status == FriendshipStatus.Accepted)
                .Select(f => f.SenderId == currentUserId ? f.ReceiverId : f.SenderId)
                .ToListAsync();

            // Allow connected users to appear in search results; only exclude the current user
            var query = _context.Users
                .Where(u => u.Id != currentUserId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
                query = query.Where(u => u.UserName!.Contains(q) || u.FullName.Contains(q));

            var users = await query
                .Take(20)
                .Select(u => new UserProfileDto
                {
                    Id = u.Id,
                    Username = u.UserName!,
                    FullName = u.FullName,
                    AvatarUrl = u.AvatarUrl,
                    JobTitle = u.JobTitle,
                    Company = u.Company,
                    IsConnected = _context.Friendships.Any(f => (f.SenderId == currentUserId && f.ReceiverId == u.Id || f.SenderId == u.Id && f.ReceiverId == currentUserId) && f.Status == FriendshipStatus.Accepted)
                })
                .ToListAsync();

            return Ok(ApiResponse<List<UserProfileDto>>.Ok(users));
        }
    }
}