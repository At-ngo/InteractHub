using InteractHub.API.Data;
using InteractHub.API.DTOs.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HashtagsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public HashtagsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending()
        {
            var hashtags = await _context.Hashtags
                .OrderByDescending(h => h.UseCount)
                .Take(10)
                .Select(h => new { h.Id, h.Name, h.UseCount })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(hashtags));
        }
    }
}