using InteractHub.API.DTOs.Common;
using InteractHub.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class UploadController : BaseApiController
    {
        private readonly IUploadService _uploadService;

        public UploadController(IUploadService uploadService)
        {
            _uploadService = uploadService;
        }

        [HttpPost("image")]
        public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string folder = "posts")
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<string>.Fail("Vui lòng chọn file"));

            if (!Constants.ApiConstants.AllowedImageTypes.Contains(file.ContentType.ToLower()))
                return BadRequest(ApiResponse<string>.Fail("Chỉ hỗ trợ file ảnh (jpg, png, gif, webp)"));

            if (file.Length > Constants.ApiConstants.MaxImageBytes)
                return BadRequest(ApiResponse<string>.Fail($"File không được vượt quá {Constants.ApiConstants.MaxImageBytes / (1024 * 1024)}MB"));

            var url = await _uploadService.UploadImageAsync(file, folder);
            return Ok(ApiResponse<string>.Ok(url, "Upload thành công"));
        }

        [HttpPost("video")]
        public async Task<IActionResult> UploadVideo(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<string>.Fail("Vui lòng chọn file"));

            if (!Constants.ApiConstants.AllowedVideoTypes.Contains(file.ContentType.ToLower()))
                return BadRequest(ApiResponse<string>.Fail("Chỉ hỗ trợ file video (mp4, mov, webm)"));

            if (file.Length > Constants.ApiConstants.MaxVideoBytes)
                return BadRequest(ApiResponse<string>.Fail($"File không được vượt quá {Constants.ApiConstants.MaxVideoBytes / (1024 * 1024)}MB"));

            var url = await _uploadService.UploadVideoAsync(file);
            return Ok(ApiResponse<string>.Ok(url, "Upload video thành công"));
        }
    }
}