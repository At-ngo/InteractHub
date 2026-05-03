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
    public class JobsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public JobsController(AppDbContext context) { _context = context; }
        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpGet]
        public async Task<IActionResult> GetJobs([FromQuery] string? q, [FromQuery] string? location)
        {
            var query = _context.Jobs
                .Where(j => j.IsActive)
                .Include(j => j.PostedBy)
                .Include(j => j.Applications)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
                query = query.Where(j => j.Title.Contains(q) || j.Company.Contains(q) || j.Description.Contains(q));

            if (!string.IsNullOrWhiteSpace(location))
                query = query.Where(j => j.Location.Contains(location));

            var userId = GetUserId();
            var jobs = await query
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    j.Id, j.Title, j.Company, j.Location,
                    j.Description, j.Requirements, j.Salary,
                    j.JobType, j.CreatedAt,
                    PostedBy = new { j.PostedBy.FullName, j.PostedBy.AvatarUrl },
                    ApplicationCount = j.Applications.Count,
                    HasApplied = j.Applications.Any(a => a.ApplicantId == userId)
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(jobs));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJob(int id)
        {
            var userId = GetUserId();
            var job = await _context.Jobs
                .Include(j => j.PostedBy)
                .Include(j => j.Applications)
                .Where(j => j.Id == id)
                .Select(j => new
                {
                    j.Id, j.Title, j.Company, j.Location,
                    j.Description, j.Requirements, j.Salary,
                    j.JobType, j.CreatedAt,
                    PostedBy = new { j.PostedBy.Id, j.PostedBy.FullName, j.PostedBy.AvatarUrl },
                    ApplicationCount = j.Applications.Count,
                    HasApplied = j.Applications.Any(a => a.ApplicantId == userId)
                })
                .FirstOrDefaultAsync();

            if (job == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy việc làm"));

            return Ok(ApiResponse<object>.Ok(job));
        }

        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobDto dto)
        {
            var userId = GetUserId();
            var job = new Job
            {
                Title = dto.Title,
                Company = dto.Company,
                Location = dto.Location,
                Description = dto.Description,
                Requirements = dto.Requirements,
                Salary = dto.Salary,
                JobType = dto.JobType,
                PostedById = userId
            };
            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã đăng việc làm"));
        }

        [HttpPost("{id}/apply")]
        public async Task<IActionResult> Apply(int id, [FromBody] ApplyJobDto dto)
        {
            var userId = GetUserId();
            var existing = await _context.JobApplications
                .AnyAsync(a => a.JobId == id && a.ApplicantId == userId);

            if (existing)
                return BadRequest(ApiResponse<string>.Fail("Bạn đã ứng tuyển vị trí này rồi"));

            _context.JobApplications.Add(new JobApplication
            {
                JobId = id,
                ApplicantId = userId,
                CoverLetter = dto.CoverLetter
            });
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Ứng tuyển thành công"));
        }

        [HttpGet("my-applications")]
        public async Task<IActionResult> GetMyApplications()
        {
            var userId = GetUserId();
            var applications = await _context.JobApplications
                .Where(a => a.ApplicantId == userId)
                .Include(a => a.Job)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id, a.Status, a.CreatedAt, a.CoverLetter,
                    Job = new { a.Job.Id, a.Job.Title, a.Job.Company, a.Job.Location }
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(applications));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var userId = GetUserId();
            var job = await _context.Jobs
                .FirstOrDefaultAsync(j => j.Id == id && j.PostedById == userId);

            if (job == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy việc làm"));

            job.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã xóa việc làm"));
        }
    }

    public class CreateJobDto
    {
        public string Title { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Requirements { get; set; }
        public string? Salary { get; set; }
        public string JobType { get; set; } = "Full-time";
    }

    public class ApplyJobDto
    {
        public string CoverLetter { get; set; } = string.Empty;
    }
}