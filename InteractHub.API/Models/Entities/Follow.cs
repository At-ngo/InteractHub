namespace InteractHub.API.Models.Entities
{
    public class Follow
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string FollowerId { get; set; } = string.Empty;
        public string FollowingId { get; set; } = string.Empty;
        public AppUser Follower { get; set; } = null!;
        public AppUser Following { get; set; } = null!;
    }
}