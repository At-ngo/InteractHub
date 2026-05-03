namespace InteractHub.API.DTOs.User
{
    public class UserProfileDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverUrl { get; set; }
        public string? JobTitle { get; set; }
        public string? Company { get; set; }
        public string? Location { get; set; }
        public DateTime CreatedAt { get; set; }
        public int PostCount { get; set; }
        public int FriendCount { get; set; }
        public List<ExperienceResponseDto> Experiences { get; set; } = new();
        public List<EducationResponseDto> Educations { get; set; } = new();
        public List<string> Skills { get; set; } = new();
        public string? GitHubUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public int FollowerCount { get; set; }
        public int FollowingCount { get; set; }
        public bool IsFollowing { get; set; }
        public bool IsConnected { get; set; }
        public DateTime? LastActiveAt { get; set; }
    }
}