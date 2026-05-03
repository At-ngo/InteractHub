using InteractHub.API.Data;
using InteractHub.API.DTOs.Post;
using InteractHub.API.Models.Entities;
using InteractHub.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.API.Services.Implementations
{
    public class PostService : IPostService
    {
        private readonly AppDbContext _context;

        public PostService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<PostResponseDto>> GetPostsAsync(int page, int pageSize, string currentUserId)
        {
            return await _context.Posts
                .Where(p => !p.IsDeleted)
                .Include(p => p.User)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new PostResponseDto
                {
                    Id = p.Id,
                    Content = p.Content,
                    ImageUrl = p.ImageUrl,
                    CreatedAt = p.CreatedAt,
                    UserId = p.UserId,
                    Username = p.User.UserName!,
                    FullName = p.User.FullName,
                    AvatarUrl = p.User.AvatarUrl,
                    LikeCount = p.Likes.Count,
                    CommentCount = p.Comments.Count(c => !c.IsDeleted),
                    IsLikedByCurrentUser = p.Likes.Any(l => l.UserId == currentUserId),
                    Hashtags = p.PostHashtags.Select(ph => ph.Hashtag.Name).ToList()
                })
                .ToListAsync();
        }

        public async Task<PostResponseDto?> GetPostByIdAsync(int id, string currentUserId)
        {
            return await _context.Posts
                .Where(p => p.Id == id && !p.IsDeleted)
                .Include(p => p.User)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
                .Select(p => new PostResponseDto
                {
                    Id = p.Id,
                    Content = p.Content,
                    ImageUrl = p.ImageUrl,
                    CreatedAt = p.CreatedAt,
                    UserId = p.UserId,
                    Username = p.User.UserName!,
                    FullName = p.User.FullName,
                    AvatarUrl = p.User.AvatarUrl,
                    LikeCount = p.Likes.Count,
                    CommentCount = p.Comments.Count(c => !c.IsDeleted),
                    IsLikedByCurrentUser = p.Likes.Any(l => l.UserId == currentUserId),
                    Hashtags = p.PostHashtags.Select(ph => ph.Hashtag.Name).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Success, string Message)> CreatePostAsync(CreatePostDto dto, string userId)
        {
            var post = new Post
            {
                Content = dto.Content,
                ImageUrl = dto.ImageUrl,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            foreach (var tag in dto.Hashtags)
            {
                var hashtag = await _context.Hashtags
                    .FirstOrDefaultAsync(h => h.Name == tag.ToLower());

                if (hashtag == null)
                {
                    hashtag = new Hashtag { Name = tag.ToLower(), UseCount = 0 };
                    _context.Hashtags.Add(hashtag);
                    await _context.SaveChangesAsync();
                }

                hashtag.UseCount++;
                _context.PostHashtags.Add(new PostHashtag
                {
                    PostId = post.Id,
                    HashtagId = hashtag.Id
                });
            }

            await _context.SaveChangesAsync();
            return (true, "Tạo bài viết thành công");
        }

        public async Task<(bool Success, string Message)> UpdatePostAsync(int id, UpdatePostDto dto, string userId)
        {
            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (post == null)
                return (false, "Không tìm thấy bài viết");

            post.Content = dto.Content;
            post.ImageUrl = dto.ImageUrl;
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Cập nhật thành công");
        }

        public async Task<(bool Success, string Message)> DeletePostAsync(int id, string userId)
        {
            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (post == null)
                return (false, "Không tìm thấy bài viết");

            post.IsDeleted = true;
            await _context.SaveChangesAsync();
            return (true, "Xóa thành công");
        }

        public async Task<(bool Success, string Message)> ToggleLikeAsync(int postId, string userId)
        {
            var existing = await _context.Likes
                .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

            if (existing != null)
            {
                _context.Likes.Remove(existing);
                await _context.SaveChangesAsync();
                return (true, "Đã bỏ like");
            }

            _context.Likes.Add(new Like { PostId = postId, UserId = userId });
            await _context.SaveChangesAsync();
            return (true, "Đã like");
        }
    }
}