using System;

namespace InteractHub.API.Models.Entities
{
    public class ReportActionLog
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public string Action { get; set; } = string.Empty; // ban-user, delete-post, delete-comment, warn-user
        public string? Message { get; set; }
        public string PerformedBy { get; set; } = string.Empty;
        public DateTime PerformedAt { get; set; }
    }

    public class Appeal
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public string RequesterId { get; set; } = string.Empty; // who appealed
        public string Reason { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsResolved { get; set; } = false;
        public bool? IsApproved { get; set; } = null; // null = pending, true = approved, false = rejected
    }
}
