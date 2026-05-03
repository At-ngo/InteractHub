namespace InteractHub.API.DTOs.Friends;

public class FriendRequestDto
{
    public string ReceiverId { get; set; } = "";
}

public class FriendshipResponseDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";
    public string Username { get; set; } = "";
    public string? AvatarUrl { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}