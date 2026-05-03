namespace InteractHub.API.Models.Entities
{
    public class Hashtag
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int UseCount { get; set; } = 0;

        public ICollection<PostHashtag> PostHashtags { get; set; } = new List<PostHashtag>();
    }
}