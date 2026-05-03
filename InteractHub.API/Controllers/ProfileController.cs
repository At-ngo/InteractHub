using InteractHub.API.Data;
using InteractHub.API.DTOs.Common;
using InteractHub.API.DTOs.User;
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
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ProfileController(AppDbContext context) { _context = context; }
        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        // ===== EXPERIENCE =====
        [HttpGet("experience")]
        public async Task<IActionResult> GetExperiences()
        {
            var userId = GetUserId();
            var list = await _context.Experiences
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.StartDate)
                .Select(e => new ExperienceResponseDto
                {
                    Id = e.Id, Title = e.Title, Company = e.Company,
                    Location = e.Location, StartDate = e.StartDate,
                    EndDate = e.EndDate, IsCurrentJob = e.IsCurrentJob,
                    Description = e.Description
                }).ToListAsync();
            return Ok(ApiResponse<List<ExperienceResponseDto>>.Ok(list));
        }

        [HttpPost("experience")]
        public async Task<IActionResult> AddExperience([FromBody] CreateExperienceDto dto)
        {
            var userId = GetUserId();
            _context.Experiences.Add(new Experience
            {
                Title = dto.Title, Company = dto.Company,
                Location = dto.Location, StartDate = dto.StartDate,
                EndDate = dto.IsCurrentJob ? null : dto.EndDate,
                IsCurrentJob = dto.IsCurrentJob,
                Description = dto.Description, UserId = userId
            });
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã thêm kinh nghiệm"));
        }

        [HttpDelete("experience/{id}")]
        public async Task<IActionResult> DeleteExperience(int id)
        {
            var userId = GetUserId();
            var exp = await _context.Experiences
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
            if (exp == null) return NotFound(ApiResponse<string>.Fail("Không tìm thấy"));
            _context.Experiences.Remove(exp);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã xóa"));
        }

        // ===== EDUCATION =====
        [HttpGet("education")]
        public async Task<IActionResult> GetEducations()
        {
            var userId = GetUserId();
            var list = await _context.Educations
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.StartDate)
                .Select(e => new EducationResponseDto
                {
                    Id = e.Id, School = e.School, Degree = e.Degree,
                    FieldOfStudy = e.FieldOfStudy, StartDate = e.StartDate,
                    EndDate = e.EndDate, Description = e.Description
                }).ToListAsync();
            return Ok(ApiResponse<List<EducationResponseDto>>.Ok(list));
        }

        [HttpPost("education")]
        public async Task<IActionResult> AddEducation([FromBody] CreateEducationDto dto)
        {
            var userId = GetUserId();
            _context.Educations.Add(new Education
            {
                School = dto.School, Degree = dto.Degree,
                FieldOfStudy = dto.FieldOfStudy, StartDate = dto.StartDate,
                EndDate = dto.EndDate, Description = dto.Description,
                UserId = userId
            });
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã thêm học vấn"));
        }

        [HttpDelete("education/{id}")]
        public async Task<IActionResult> DeleteEducation(int id)
        {
            var userId = GetUserId();
            var edu = await _context.Educations
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
            if (edu == null) return NotFound(ApiResponse<string>.Fail("Không tìm thấy"));
            _context.Educations.Remove(edu);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã xóa"));
        }

        // ===== SKILLS =====
        [HttpGet("skills")]
        public async Task<IActionResult> GetSkills()
        {
            var userId = GetUserId();
            var skills = await _context.Skills
                .Where(s => s.UserId == userId)
                .Select(s => new { s.Id, s.Name })
                .ToListAsync();
            return Ok(ApiResponse<object>.Ok(skills));
        }

        [HttpPost("skills")]
        public async Task<IActionResult> AddSkill([FromBody] string skillName)
        {
            var userId = GetUserId();
            var exists = await _context.Skills
                .AnyAsync(s => s.UserId == userId && s.Name == skillName);
            if (exists) return BadRequest(ApiResponse<string>.Fail("Kỹ năng đã tồn tại"));

            _context.Skills.Add(new Skill { Name = skillName, UserId = userId });
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã thêm kỹ năng"));
        }

        [HttpDelete("skills/{id}")]
        public async Task<IActionResult> DeleteSkill(int id)
        {
            var userId = GetUserId();
            var skill = await _context.Skills
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (skill == null) return NotFound(ApiResponse<string>.Fail("Không tìm thấy"));
            _context.Skills.Remove(skill);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã xóa"));
        }
    }
}