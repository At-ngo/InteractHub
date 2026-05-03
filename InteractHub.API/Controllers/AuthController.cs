using InteractHub.API.DTOs.Auth;
using InteractHub.API.DTOs.Common;
using InteractHub.API.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace InteractHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
        public class AuthController : BaseApiController
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IConfiguration _config;

        public AuthController(UserManager<AppUser> userManager, IConfiguration config)
        {
            _userManager = userManager;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<string>.Fail(Constants.ApiConstants.InvalidModelMessage));

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return BadRequest(ApiResponse<string>.Fail("Email đã được sử dụng"));

            var user = new AppUser
            {
                UserName = dto.Username,
                Email = dto.Email,
                FullName = dto.FullName,
                DateOfBirth = dto.DateOfBirth,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Đăng ký thất bại",
                    Errors = errors
                });
            }

                await _userManager.AddToRoleAsync(user, Constants.ApiConstants.DefaultUserRole);
            return Ok(ApiResponse<string>.Ok("Đăng ký thành công"));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<string>.Fail(Constants.ApiConstants.InvalidModelMessage));

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return Unauthorized(ApiResponse<string>.Fail("Email hoặc mật khẩu không đúng"));

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!isPasswordValid)
                return Unauthorized(ApiResponse<string>.Fail("Email hoặc mật khẩu không đúng"));

            var token = GenerateJwtToken(user);
                var expiresAt = DateTime.UtcNow.AddDays(Constants.ApiConstants.JwtExpiryDays);

            var response = new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Username = user.UserName!,
                Email = user.Email!,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                ExpiresAt = expiresAt
            };

            return Ok(ApiResponse<AuthResponseDto>.Ok(response, "Đăng nhập thành công"));
        }

        private string GenerateJwtToken(AppUser user)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim("FullName", user.FullName)
            };

            // include roles
            var roles = _userManager.GetRolesAsync(user).Result;
            foreach (var r in roles)
                claims.Add(new Claim(ClaimTypes.Role, r));

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                    expires: DateTime.UtcNow.AddDays(Constants.ApiConstants.JwtExpiryDays),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}