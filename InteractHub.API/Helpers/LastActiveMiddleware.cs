using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using InteractHub.API.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.API.Helpers
{
    public class LastActiveMiddleware
    {
        private readonly RequestDelegate _next;
        public LastActiveMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context, AppDbContext db)
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrEmpty(userId))
                {
                    var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
                    if (user != null)
                    {
                        user.LastActiveAt = DateTime.UtcNow;
                        await db.SaveChangesAsync();
                    }
                }
            }
            await _next(context);
        }
    }
}
