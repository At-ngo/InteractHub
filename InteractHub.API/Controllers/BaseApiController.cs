using InteractHub.API.DTOs.Common;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InteractHub.API.Controllers
{
    [ApiController]
    public abstract class BaseApiController : ControllerBase
    {
        protected string? GetUserIdFromClaims()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        protected BadRequestObjectResult BadRequestModel() => BadRequest(ApiResponse<string>.Fail("Dữ liệu không hợp lệ"));
    }
}
