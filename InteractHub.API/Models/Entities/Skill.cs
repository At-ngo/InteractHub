namespace InteractHub.API.Models.Entities
{
    public class Skill
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public string UserId { get; set; } = string.Empty;
        public AppUser User { get; set; } = null!;
    }
}