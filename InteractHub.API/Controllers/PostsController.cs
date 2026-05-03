using InteractHub.API.Data;
using InteractHub.API.DTOs.Common;
using InteractHub.API.DTOs.Post;
using InteractHub.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using InteractHub.API.Constants;
using System.Linq;

namespace InteractHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PostsController : BaseApiController
    {
        private readonly AppDbContext _context;

        public PostsController(AppDbContext context)
        {
            _context = context;
        }

    private string GetUserId() => GetUserIdFromClaims()!;

        [HttpGet]
    public async Task<IActionResult> GetPosts([FromQuery] int page = ApiConstants.DefaultPage, [FromQuery] int pageSize = ApiConstants.DefaultPageSize)
        {
            var userId = GetUserId();
            var savedIds = await _context.Notifications
        .Where(n => n.UserId == userId && n.Type == ApiConstants.NotificationSaved)
                .Select(n => n.RelatedEntityId)
                .ToListAsync();
            var posts = await _context.Posts
                .Where(p => !p.IsDeleted)
                .Include(p => p.User)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
                .Include(p => p.SharedPost).ThenInclude(sp => sp.User)
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
                    IsLikedByCurrentUser = p.Likes.Any(l => l.UserId == userId),
                    CommentPermission = p.CommentPermission,
                    Hashtags = p.PostHashtags.Select(ph => ph.Hashtag.Name).ToList(),
                    IsSaved = savedIds.Contains(p.Id.ToString()),
                    IsShare = p.SharedPostId != null,
                    SharedPost = p.SharedPost == null ? null : new SharedPostDto
                    {
                        Id = p.SharedPost.Id,
                        UserId = p.SharedPost.UserId,
                        Username = p.SharedPost.User.UserName!,
                        FullName = p.SharedPost.User.FullName,
                        AvatarUrl = p.SharedPost.User.AvatarUrl,
                        Content = p.SharedPost.Content,
                        ImageUrl = p.SharedPost.ImageUrl
                    }
                })
                .ToListAsync();

            return Ok(ApiResponse<List<PostResponseDto>>.Ok(posts));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPost(int id)
        {
            var userId = GetUserId();
            var savedIds = await _context.Notifications
                .Where(n => n.UserId == userId && n.Type == ApiConstants.NotificationSaved)
                .Select(n => n.RelatedEntityId)
                .ToListAsync();
            var post = await _context.Posts
                .Where(p => p.Id == id && !p.IsDeleted)
                .Include(p => p.User)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
                .FirstOrDefaultAsync();

            if (post == null)
                return NotFound(ApiResponse<string>.Fail(ApiConstants.ResourceNotFoundMessage));

            // ensure SharedPost is loaded for single post result
            await _context.Entry(post).Reference(p => p.SharedPost).LoadAsync();
            if (post.SharedPost != null)
            {
                await _context.Entry(post.SharedPost).Reference(sp => sp.User).LoadAsync();
            }

            var result = new PostResponseDto
            {
                Id = post.Id,
                Content = post.Content,
                ImageUrl = post.ImageUrl,
                CreatedAt = post.CreatedAt,
                UserId = post.UserId,
                Username = post.User.UserName!,
                FullName = post.User.FullName,
                AvatarUrl = post.User.AvatarUrl,
                LikeCount = post.Likes.Count,
                CommentCount = post.Comments.Count(c => !c.IsDeleted),
                IsLikedByCurrentUser = post.Likes.Any(l => l.UserId == userId),
                Hashtags = post.PostHashtags.Select(ph => ph.Hashtag.Name).ToList(),
                IsSaved = savedIds.Contains(post.Id.ToString()),
                IsShare = post.SharedPostId != null,
                SharedPost = post.SharedPost == null ? null : new SharedPostDto
                {
                    Id = post.SharedPost.Id,
                    UserId = post.SharedPost.UserId,
                    Username = post.SharedPost.User.UserName!,
                    FullName = post.SharedPost.User.FullName,
                    AvatarUrl = post.SharedPost.User.AvatarUrl,
                    Content = post.SharedPost.Content,
                    ImageUrl = post.SharedPost.ImageUrl
                }
            };

            return Ok(ApiResponse<PostResponseDto>.Ok(result));
        }

        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<string>.Fail(ApiConstants.InvalidModelMessage));

            var userId = GetUserId();
            var post = new Post
            {
                Content = dto.Content,
                ImageUrl = dto.ImageUrl,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                SharedPostId = dto.SharedPostId
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            // Xử lý hashtags (an toàn với null và normalize)
            foreach (var tag in dto.Hashtags ?? Enumerable.Empty<string>())
            {
                var normalized = tag.Trim().ToLower();
                var hashtag = await _context.Hashtags.FirstOrDefaultAsync(h => h.Name == normalized);
                if (hashtag == null)
                {
                    hashtag = new Hashtag { Name = normalized, UseCount = 0 };
                    _context.Hashtags.Add(hashtag);
                    await _context.SaveChangesAsync();
                }
                hashtag.UseCount++;
                _context.PostHashtags.Add(new PostHashtag { PostId = post.Id, HashtagId = hashtag.Id });
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Tạo bài viết thành công"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDto dto)
        {
            var userId = GetUserId();
            var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (post == null)
                return NotFound(ApiResponse<string>.Fail(ApiConstants.ResourceNotFoundMessage));

            post.Content = dto.Content;
            post.ImageUrl = dto.ImageUrl;
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Cập nhật thành công"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(int id)
        {
            var userId = GetUserId();
            var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (post == null)
                return NotFound(ApiResponse<string>.Fail(ApiConstants.ResourceNotFoundMessage));

            post.IsDeleted = true;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Xóa bài viết thành công"));
        }

        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikePost(int id, [FromBody] LikeDto? dto)
        {
            var userId = GetUserId();
            var existing = await _context.Likes
                .FirstOrDefaultAsync(l => l.PostId == id && l.UserId == userId);

            var post = await _context.Posts.FindAsync(id);
            if (post == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy bài viết"));

            if (existing != null)
            {
                // Nếu cùng reaction thì bỏ like, khác reaction thì đổi
                if (existing.ReactionType == (dto?.ReactionType ?? ApiConstants.DefaultReaction))
                {
                    _context.Likes.Remove(existing);
                    await _context.SaveChangesAsync();
                    return Ok(ApiResponse<string>.Ok("Đã bỏ cảm xúc"));
                }
                existing.ReactionType = dto?.ReactionType ?? ApiConstants.DefaultReaction;
                await _context.SaveChangesAsync();
                return Ok(ApiResponse<string>.Ok("Đã đổi cảm xúc"));
            }

            _context.Likes.Add(new Like
            {
                PostId = id,
                UserId = userId,
                ReactionType = dto?.ReactionType ?? ApiConstants.DefaultReaction
            });

            if (post.UserId != userId)
            {
                var liker = await _context.Users.FindAsync(userId);
                _context.Notifications.Add(new Notification
                {
                    UserId = post.UserId,
                    Message = $"{liker!.FullName} đã thả cảm xúc bài viết của bạn",
                    Type = ApiConstants.NotificationLike,
                    RelatedEntityId = id.ToString()
                });
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã thả cảm xúc"));
        }

        public class LikeDto
        {
            public string ReactionType { get; set; } = "like";
        }

        [HttpGet("{id}/reactions")]
        public async Task<IActionResult> GetReactions(int id)
        {
            var reactions = await _context.Likes
                .Where(l => l.PostId == id)
                .Include(l => l.User)
                .Select(l => new
                {
                    l.UserId,
                    l.User.FullName,
                    l.User.AvatarUrl,
                    l.ReactionType,
                    l.CreatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(reactions));
        }


        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetComments(int id)
        {
            var userId = GetUserId();
            var comments = await _context.Comments
                .Where(c => c.PostId == id && !c.IsDeleted && c.ParentCommentId == null)
                .Include(c => c.User)
                .Include(c => c.Reactions)
                .Include(c => c.Replies).ThenInclude(r => r.User)
                .Include(c => c.Replies).ThenInclude(r => r.Reactions)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Content,
                    c.CreatedAt,
                    c.UserId,
                    Username = c.User.UserName,
                    c.User.AvatarUrl,
                    ReactionCount = c.Reactions.Count,
                    UserReaction = c.Reactions.FirstOrDefault(r => r.UserId == userId) != null
                        ? c.Reactions.First(r => r.UserId == userId).ReactionType : null,
                    Replies = c.Replies.Select(r => new
                    {
                        r.Id,
                        r.Content,
                        r.CreatedAt,
                        r.UserId,
                        Username = r.User.UserName,
                        r.User.AvatarUrl,
                        ReactionCount = r.Reactions.Count,
                        UserReaction = r.Reactions.FirstOrDefault(rx => rx.UserId == userId) != null
                            ? r.Reactions.First(rx => rx.UserId == userId).ReactionType : null,
                    }).ToList()
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(comments));
        }

        [HttpPut("{id}/comment-permission")]
        public async Task<IActionResult> UpdateCommentPermission(int id, [FromBody] CommentPermissionDto dto)
        {
            var userId = GetUserId();
            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (post == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy bài viết"));

            post.CommentPermission = dto.Permission;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã cập nhật quyền bình luận"));
        }

        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
        {
            var userId = GetUserId();
            var post = await _context.Posts.FindAsync(id);

            if (post == null || post.IsDeleted)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy bài viết"));

            // Kiểm tra permission
            if (post.CommentPermission == "none" && post.UserId != userId)
                return BadRequest(ApiResponse<string>.Fail("Bài viết này đã tắt bình luận"));

            if (post.CommentPermission == "connections" && post.UserId != userId)
            {
                var isConnected = await _context.Friendships
                    .AnyAsync(f => (f.SenderId == userId && f.ReceiverId == post.UserId ||
                                f.SenderId == post.UserId && f.ReceiverId == userId) &&
                                f.Status == FriendshipStatus.Accepted);
                if (!isConnected)
                    return BadRequest(ApiResponse<string>.Fail("Chỉ kết nối mới được bình luận"));
            }

            var comment = new Comment
            {
                Content = dto.Content,
                PostId = id,
                UserId = userId
            };

            _context.Comments.Add(comment);

            if (post.UserId != userId)
            {
                var commenter = await _context.Users.FindAsync(userId);
                _context.Notifications.Add(new Notification
                {
                    UserId = post.UserId,
                    Message = $"{commenter!.FullName} đã bình luận bài viết của bạn",
                    Type = "comment",
                    RelatedEntityId = id.ToString()
                });
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã thêm bình luận"));
        }

        [HttpDelete("{postId}/comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int postId, int commentId)
        {
            var userId = GetUserId();
            var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == commentId && c.PostId == postId && !c.IsDeleted);
            if (comment == null) return NotFound(ApiResponse<string>.Fail("Không tìm thấy bình luận"));
            if (comment.UserId != userId) return Forbid();
            comment.IsDeleted = true;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã xóa bình luận"));
        }

        public class CommentPermissionDto
        {
            public string Permission { get; set; } = "everyone";
        }

        [HttpPost("{id}/save")]
        public async Task<IActionResult> SavePost(int id)
        {
            var userId = GetUserId();
            // Dùng notification để lưu tạm
            var existing = await _context.Notifications
                .FirstOrDefaultAsync(n => n.UserId == userId &&
                    n.Type == "saved" && n.RelatedEntityId == id.ToString());

            if (existing != null)
            {
                _context.Notifications.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(ApiResponse<object>.Ok(new { saved = false }));
            }

            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Message = "Bài viết đã lưu",
                Type = "saved",
                RelatedEntityId = id.ToString()
            });
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.Ok(new { saved = true }));
        }

            [HttpGet("comments/{commentId}")]
            public async Task<IActionResult> GetCommentById(int commentId)
            {
                var comment = await _context.Comments.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == commentId);
                if (comment == null) return NotFound(ApiResponse<string>.Fail("Comment not found"));
                return Ok(ApiResponse<object>.Ok(new {
                    id = comment.Id,
                    content = comment.Content,
                    userId = comment.UserId,
                    username = comment.User.UserName,
                    fullName = comment.User.FullName,
                    createdAt = comment.CreatedAt,
                    postId = comment.PostId
                }));
            }
        // Reply comment
        [HttpPost("{postId}/comments/{commentId}/reply")]
        public async Task<IActionResult> ReplyComment(int postId, int commentId, [FromBody] CreateCommentDto dto)
        {
            var userId = GetUserId();
            var parentComment = await _context.Comments.FindAsync(commentId);
            if (parentComment == null)
                return NotFound(ApiResponse<string>.Fail("Không tìm thấy bình luận"));

            var replier = await _context.Users.FindAsync(userId);
            var comment = new Comment
            {
                Content = $"@{parentComment.User?.UserName ?? ""} {dto.Content}",
                PostId = postId,
                UserId = userId,
                ParentCommentId = commentId
            };

            _context.Comments.Add(comment);

            // Thông báo cho người được reply
            if (parentComment.UserId != userId)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = parentComment.UserId,
                    Message = $"{replier!.FullName} đã trả lời bình luận của bạn",
                    Type = "comment_reply",
                    RelatedEntityId = postId.ToString()
                });
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("Đã trả lời"));
        }

        // React comment
        [HttpPost("{postId}/comments/{commentId}/react")]
        public async Task<IActionResult> ReactComment(int postId, int commentId, [FromBody] LikeDto dto)
        {
            var userId = GetUserId();
            var existing = await _context.CommentReactions
                .FirstOrDefaultAsync(r => r.CommentId == commentId && r.UserId == userId);

            if (existing != null)
            {
                if (existing.ReactionType == dto.ReactionType)
                {
                    _context.CommentReactions.Remove(existing);
                }
                else
                {
                    existing.ReactionType = dto.ReactionType;
                }
            }
            else
            {
                _context.CommentReactions.Add(new CommentReaction
                {
                    CommentId = commentId,
                    UserId = userId,
                    ReactionType = dto.ReactionType
                });
            }

            // Tạo thông báo cho tác giả comment nếu không phải chính mình (một lần)
            var commentEntity = await _context.Comments.FindAsync(commentId);
            if (commentEntity != null && commentEntity.UserId != userId)
            {
                var reactor = await _context.Users.FindAsync(userId);
                _context.Notifications.Add(new Notification
                {
                    UserId = commentEntity.UserId,
                    Message = $"{reactor!.FullName} đã bày tỏ cảm xúc trên bình luận của bạn",
                    Type = ApiConstants.NotificationCommentReaction,
                    RelatedEntityId = postId.ToString()
                });
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("OK"));
        }

        [HttpGet("{postId}/comments/{commentId}/reactions")]
        public async Task<IActionResult> GetCommentReactions(int postId, int commentId)
        {
            var reactors = await _context.CommentReactions
                .Where(r => r.CommentId == commentId)
                .Include(r => r.User)
                .Select(r => new
                {
                    r.UserId,
                    r.User.FullName,
                    r.User.AvatarUrl,
                    r.ReactionType,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(reactors));
        }

        [HttpGet("comments/{commentId}/reactors")]
        public async Task<IActionResult> GetCommentReactors(int commentId)
        {
            var reactors = await _context.CommentReactions
                .Where(r => r.CommentId == commentId)
                .Include(r => r.User)
                .Select(r => new
                {
                    r.UserId,
                    r.User.FullName,
                    r.User.AvatarUrl,
                    r.ReactionType,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(reactors));
        }

        [HttpGet("saved")]
        public async Task<IActionResult> GetSavedPosts()
        {
            var userId = GetUserId();
            var savedIds = await _context.Notifications
                .Where(n => n.UserId == userId && n.Type == "saved")
                .Select(n => n.RelatedEntityId)
                .ToListAsync();

            var posts = await _context.Posts
                .Where(p => savedIds.Contains(p.Id.ToString()) && !p.IsDeleted)
                .Include(p => p.User)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
                .Include(p => p.SharedPost).ThenInclude(sp => sp.User)
                .OrderByDescending(p => p.CreatedAt)
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
                    IsLikedByCurrentUser = p.Likes.Any(l => l.UserId == userId),
                    Hashtags = p.PostHashtags.Select(ph => ph.Hashtag.Name).ToList(),
                    CommentPermission = p.CommentPermission,
                    IsShare = p.SharedPostId != null,
                    SharedPost = p.SharedPost == null ? null : new SharedPostDto
                    {
                        Id = p.SharedPost.Id,
                        UserId = p.SharedPost.UserId,
                        Username = p.SharedPost.User.UserName!,
                        FullName = p.SharedPost.User.FullName,
                        AvatarUrl = p.SharedPost.User.AvatarUrl,
                        Content = p.SharedPost.Content,
                        ImageUrl = p.SharedPost.ImageUrl
                    }
                })
                .ToListAsync();

            return Ok(ApiResponse<List<PostResponseDto>>.Ok(posts));
        }



    }
}