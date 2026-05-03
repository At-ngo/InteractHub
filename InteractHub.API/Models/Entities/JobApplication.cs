namespace InteractHub.API.Models.Entities
{
    public enum ApplicationStatus { Pending, Reviewed, Accepted, Rejected }

    public class JobApplication
    {
        public int Id { get; set; }
        public string CoverLetter { get; set; } = string.Empty;
        public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int JobId { get; set; }
        public string ApplicantId { get; set; } = string.Empty;
        public Job Job { get; set; } = null!;
        public AppUser Applicant { get; set; } = null!;
    }
}