using InteractHub.API.DTOs.Common;
using InteractHub.API.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevController : BaseApiController
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<DevController> _logger;

        public DevController(UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager, IWebHostEnvironment env, ILogger<DevController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _env = env;
            _logger = logger;
        }

        [HttpPost("make-admin")]
        public async Task<IActionResult> MakeAdmin([FromBody] MakeAdminDto dto)
        {
            if (!_env.IsDevelopment()) return BadRequest(ApiResponse<string>.Fail("This endpoint is only available in Development environment."));
            if (string.IsNullOrWhiteSpace(dto.Email) && string.IsNullOrWhiteSpace(dto.UserId))
                return BadRequest(ApiResponse<string>.Fail("Provide email or userId"));

            AppUser? user = null;
            if (!string.IsNullOrWhiteSpace(dto.Email)) user = await _userManager.FindByEmailAsync(dto.Email!);
            if (user == null && !string.IsNullOrWhiteSpace(dto.UserId)) user = await _userManager.FindByIdAsync(dto.UserId!);
            if (user == null) return NotFound(ApiResponse<string>.Fail("User not found"));

            var roleExists = await _roleManager.RoleExistsAsync("Admin");
            if (!roleExists) await _roleManager.CreateAsync(new IdentityRole("Admin"));

            _logger.LogInformation("Promoting user {UserId} ({Email}) to Admin via /make-admin", user.Id, user.Email);
            var result = await _userManager.AddToRoleAsync(user, "Admin");
            if (!result.Succeeded)
            {
                var err = string.Join(';', result.Errors.Select(e => e.Description));
                _logger.LogWarning("Failed to promote user {UserId}: {Errors}", user.Id, err);
                return BadRequest(ApiResponse<string>.Fail(err));
            }

            _logger.LogInformation("User {UserId} promoted to Admin", user.Id);
            return Ok(ApiResponse<string>.Ok("User promoted to Admin"));
        }

        [HttpPost("make-admin-by-email")]
        public async Task<IActionResult> MakeAdminByEmail([FromBody] MakeAdminByEmailDto dto)
        {
            if (!_env.IsDevelopment()) return BadRequest(ApiResponse<string>.Fail("This endpoint is only available in Development environment."));
            if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest(ApiResponse<string>.Fail("Email is required"));

            var user = await _userManager.FindByEmailAsync(dto.Email!);
            if (user == null)
            {
                _logger.LogWarning("Attempt to promote non-existing user with email {Email}", dto.Email);
                return NotFound(ApiResponse<string>.Fail("User not found"));
            }

            var roleExists = await _roleManager.RoleExistsAsync("Admin");
            if (!roleExists) await _roleManager.CreateAsync(new IdentityRole("Admin"));

            _logger.LogInformation("Promoting user {UserId} ({Email}) to Admin via /make-admin-by-email", user.Id, user.Email);
            var result = await _userManager.AddToRoleAsync(user, "Admin");
            if (!result.Succeeded)
            {
                var err = string.Join(';', result.Errors.Select(e => e.Description));
                _logger.LogWarning("Failed to promote user {UserId}: {Errors}", user.Id, err);
                return BadRequest(ApiResponse<string>.Fail(err));
            }

            _logger.LogInformation("User {UserId} promoted to Admin", user.Id);
            return Ok(ApiResponse<string>.Ok($"User {user.Email} promoted to Admin"));
        }
    }

    public class MakeAdminDto { public string? Email { get; set; } public string? UserId { get; set; } }
    public class MakeAdminByEmailDto { public string? Email { get; set; } }
}
