using InteractHub.API.Data;
using InteractHub.API.DTOs.Common;
using InteractHub.API.DTOs.Post;
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
    public class ReportsController : BaseApiController
    {
        private readonly AppDbContext _context;
        private readonly InteractHub.API.Services.Interfaces.INotificationService _notificationService;
        public ReportsController(AppDbContext context, InteractHub.API.Services.Interfaces.INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] ReportDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<string>.Fail("Invalid model"));

            var reporterId = GetUserId();

            // Prevent reporting own content: check based on type
            if (dto.Type.Equals("post", StringComparison.OrdinalIgnoreCase))
            {
                var postId = 0;
                if (!int.TryParse(dto.EntityId, out postId))
                    return BadRequest(ApiResponse<string>.Fail("Invalid entityId for post"));

                var post = await _context.Posts.FindAsync(postId);
                if (post == null) return NotFound(ApiResponse<string>.Fail("Không tìm thấy bài viết"));
                if (post.UserId == reporterId) return BadRequest(ApiResponse<string>.Fail("Không thể báo cáo chính mình"));
            }
            else if (dto.Type.Equals("comment", StringComparison.OrdinalIgnoreCase))
            {
                var commentId = 0;
                if (!int.TryParse(dto.EntityId, out commentId))
                    return BadRequest(ApiResponse<string>.Fail("Invalid entityId for comment"));

                var comment = await _context.Comments.FindAsync(commentId);
                if (comment == null) return NotFound(ApiResponse<string>.Fail("Không tìm thấy bình luận"));
                if (comment.UserId == reporterId) return BadRequest(ApiResponse<string>.Fail("Không thể báo cáo chính mình"));
            }
            else if (dto.Type.Equals("profile", StringComparison.OrdinalIgnoreCase) || dto.Type.Equals("user", StringComparison.OrdinalIgnoreCase))
            {
                // EntityId should be userId
                if (dto.EntityId == reporterId) return BadRequest(ApiResponse<string>.Fail("Không thể báo cáo chính mình"));
            }

            var report = new Report
            {
                Type = dto.Type,
                EntityId = dto.EntityId,
                Reason = dto.Reason,
                ReporterId = reporterId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Add(report);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã gửi báo cáo"));
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetReports([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var reports = await _context.Set<Report>()
                .Include(r => r.Reporter)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(reports));
        }

        [HttpGet("{id}/appeals")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAppealsForReport(int id)
        {
            var appeals = await _context.Set<InteractHub.API.Models.Entities.Appeal>()
                .Where(a => a.ReportId == id)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(appeals));
        }

        [HttpPut("{id}/resolve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResolveReport(int id)
        {
            var r = await _context.Set<Report>().FindAsync(id);
            if (r == null) return NotFound(ApiResponse<string>.Fail("Không tìm thấy báo cáo"));
            r.IsResolved = true;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã xử lý báo cáo"));
        }

        public class TakeActionDto { public string Action { get; set; } = string.Empty; public string? Message { get; set; } }

        // Admin action: ban user / delete post / delete comment and log action
        [HttpPost("{id}/take-action")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TakeActionOnReport(int id, [FromBody] TakeActionDto dto)
        {
            var report = await _context.Set<Report>().FindAsync(id);
            if (report == null) return NotFound(ApiResponse<string>.Fail("Không tìm thấy báo cáo"));

            // Supported actions: ban-user, delete-post, delete-comment, warn-user
            var action = dto.Action?.ToLowerInvariant();
            var performedBy = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!;

            if (action == "ban-user")
            {
                // entityId should be a userId
                var userId = report.EntityId;
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return NotFound(ApiResponse<string>.Fail("User not found"));
                // lock account indefinitely (100 years)
                user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
                await _context.SaveChangesAsync();
                await LogAction(report.Id, performedBy, "ban-user", dto.Message);
                return Ok(ApiResponse<string>.Ok("Người dùng đã bị khóa"));
            }

            if (action == "ignore")
            {
                // mark report as resolved with no action taken
                report.IsResolved = true;
                await _context.SaveChangesAsync();
                await LogAction(report.Id, performedBy, "ignore", dto.Message);
                // notify the reporter that their report was reviewed and no violation was found
                try
                {
                    var reporterId = report.ReporterId;
                    if (!string.IsNullOrEmpty(reporterId))
                    {
                        await _notificationService.CreateNotificationAsync(reporterId, "Báo cáo của bạn đã được xem xét: không tìm thấy vi phạm", "system", report.Id.ToString());
                    }
                }
                catch { }
                return Ok(ApiResponse<string>.Ok("Báo cáo đã được bỏ qua"));
            }

            if (action == "delete-post")
            {
                if (!int.TryParse(report.EntityId, out var postId)) return BadRequest(ApiResponse<string>.Fail("Invalid post id"));
                var post = await _context.Posts.FindAsync(postId);
                if (post == null) return NotFound(ApiResponse<string>.Fail("Post not found"));
                // soft-delete so it can be restored if appeal is approved
                post.IsDeleted = true;
                _context.Posts.Update(post);
                await _context.SaveChangesAsync();
                await LogAction(report.Id, performedBy, "delete-post", dto.Message);
                return Ok(ApiResponse<string>.Ok("Bài viết đã bị xóa"));
            }

            if (action == "delete-comment")
            {
                if (!int.TryParse(report.EntityId, out var commentId)) return BadRequest(ApiResponse<string>.Fail("Invalid comment id"));
                var comment = await _context.Comments.FindAsync(commentId);
                if (comment == null) return NotFound(ApiResponse<string>.Fail("Comment not found"));
                // soft-delete comment
                comment.IsDeleted = true;
                _context.Comments.Update(comment);
                await _context.SaveChangesAsync();
                await LogAction(report.Id, performedBy, "delete-comment", dto.Message);
                return Ok(ApiResponse<string>.Ok("Bình luận đã bị xóa"));
            }

            if (action == "warn-user")
            {
                // create log entry and optionally send notification later
                await LogAction(report.Id, performedBy, "warn-user", dto.Message);
                return Ok(ApiResponse<string>.Ok("Đã gửi cảnh báo"));
            }

            return BadRequest(ApiResponse<string>.Fail("Unknown action"));
        }

        private async Task LogAction(int reportId, string performedBy, string action, string? message)
        {
            var log = new InteractHub.API.Models.Entities.ReportActionLog
            {
                ReportId = reportId,
                Action = action,
                Message = message,
                PerformedBy = performedBy,
                PerformedAt = DateTime.UtcNow
            };
            _context.Set<InteractHub.API.Models.Entities.ReportActionLog>().Add(log);
            await _context.SaveChangesAsync();
            // notify affected user depending on action
            try
            {
                if (action == "ban-user" || action == "warn-user")
                {
                    // report.EntityId should be userId
                    var userId = (await _context.Set<Report>().FindAsync(reportId))?.EntityId;
                    if (!string.IsNullOrEmpty(userId))
                    {
                        var msg = action == "ban-user" ? "Tài khoản của bạn đã bị khóa do vi phạm" : (message ?? "Bạn nhận một cảnh báo từ quản trị viên");
                        await _notificationService.CreateNotificationAsync(userId, msg, "system", reportId.ToString());
                    }
                    // also notify the reporter that action was taken
                    var report = await _context.Set<Report>().FindAsync(reportId);
                    if (report != null && !string.IsNullOrEmpty(report.ReporterId))
                    {
                        await _notificationService.CreateNotificationAsync(report.ReporterId, "Báo cáo của bạn đã được xử lý và có hành động tương ứng", "system", reportId.ToString());
                    }
                }
                else if (action == "delete-post")
                {
                    // notify post owner
                    if (int.TryParse((await _context.Set<Report>().FindAsync(reportId))?.EntityId, out var pid))
                    {
                        var post = await _context.Posts.FindAsync(pid);
                        if (post != null)
                            await _notificationService.CreateNotificationAsync(post.UserId, "Bài viết của bạn đã bị xóa bởi quản trị viên", "system", pid.ToString());
                        // notify reporter
                        var report = await _context.Set<Report>().FindAsync(reportId);
                        if (report != null && !string.IsNullOrEmpty(report.ReporterId))
                        {
                            await _notificationService.CreateNotificationAsync(report.ReporterId, "Báo cáo của bạn đã được xử lý và nội dung vi phạm đã bị xóa", "system", reportId.ToString());
                        }
                    }
                }
                else if (action == "delete-comment")
                {
                    if (int.TryParse((await _context.Set<Report>().FindAsync(reportId))?.EntityId, out var cid))
                    {
                        var comment = await _context.Comments.FindAsync(cid);
                        if (comment != null)
                            await _notificationService.CreateNotificationAsync(comment.UserId, "Bình luận của bạn đã bị xóa bởi quản trị viên", "system", cid.ToString());
                        // notify reporter
                        var report = await _context.Set<Report>().FindAsync(reportId);
                        if (report != null && !string.IsNullOrEmpty(report.ReporterId))
                        {
                            await _notificationService.CreateNotificationAsync(report.ReporterId, "Báo cáo của bạn đã được xử lý và bình luận vi phạm đã bị xóa", "system", reportId.ToString());
                        }
                    }
                }
            }
            catch { /* don't fail actions for notification errors */ }
        }

        // Submit an appeal for a report (by the affected user)
        [HttpPost("{id}/appeal")]
        public async Task<IActionResult> SubmitAppeal(int id, [FromBody] ReportAppealDto dto)
        {
            var report = await _context.Set<Report>().FindAsync(id);
            if (report == null) return NotFound(ApiResponse<string>.Fail("Report not found"));

            var userId = GetUserId();
            var appeal = new InteractHub.API.Models.Entities.Appeal
            {
                ReportId = id,
                RequesterId = userId,
                Reason = dto.Reason,
                CreatedAt = DateTime.UtcNow
            };
            _context.Set<InteractHub.API.Models.Entities.Appeal>().Add(appeal);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Appeal submitted"));
        }

        // Admin resolve appeal: approve or reject
        [HttpPut("{reportId}/appeals/{appealId}/resolve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResolveAppeal(int reportId, int appealId, [FromBody] ResolveAppealDto dto)
        {
            var appeal = await _context.Set<InteractHub.API.Models.Entities.Appeal>().FindAsync(appealId);
            if (appeal == null || appeal.ReportId != reportId) return NotFound(ApiResponse<string>.Fail("Appeal not found"));
            if (appeal.IsResolved) return BadRequest(ApiResponse<string>.Fail("Appeal already resolved"));

            appeal.IsResolved = true;
            appeal.IsApproved = dto.Approve;
            await _context.SaveChangesAsync();

            // load report for reference
            var report = await _context.Set<Report>().FindAsync(reportId);

            // if approved -> restore content or unlock user depending on original action log
            var log = await _context.Set<InteractHub.API.Models.Entities.ReportActionLog>().Where(l => l.ReportId == reportId).OrderByDescending(l => l.PerformedAt).FirstOrDefaultAsync();
            if (dto.Approve && log != null && report != null)
            {
                var action = log.Action;
                if (action == "ban-user")
                {
                    var user = await _context.Users.FindAsync(report.EntityId);
                    if (user != null)
                    {
                        user.LockoutEnd = null;
                    }
                }
                else if (action == "delete-post")
                {
                    if (int.TryParse(report.EntityId, out var postId))
                    {
                        var post = await _context.Posts.FindAsync(postId);
                        if (post != null)
                        {
                            post.IsDeleted = false;
                        }
                    }
                }
                else if (action == "delete-comment")
                {
                    if (int.TryParse(report.EntityId, out var commentId))
                    {
                        var comment = await _context.Comments.FindAsync(commentId);
                        if (comment != null)
                        {
                            comment.IsDeleted = false;
                        }
                    }
                }
                await _context.SaveChangesAsync();
            }

            // Optionally, notify the requester about result (not implemented here)
            try
            {
                var requesterId = appeal.RequesterId;
                var msg = dto.Approve ? "Kháng cáo của bạn đã được chấp nhận, nội dung đã được khôi phục" : "Kháng cáo của bạn không được chấp nhận";
                await _notificationService.CreateNotificationAsync(requesterId, msg, "system", reportId.ToString());
            }
            catch { }

            return Ok(ApiResponse<string>.Ok("Appeal resolved"));
        }
    }
}
