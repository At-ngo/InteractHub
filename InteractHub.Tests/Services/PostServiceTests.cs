using InteractHub.API.Data;
using InteractHub.API.DTOs.Post;
using InteractHub.API.Models.Entities;
using InteractHub.API.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace InteractHub.Tests.Services
{
    public class PostServiceTests
    {
        private AppDbContext CreateInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task CreatePost_ValidData_ReturnsSuccess()
        {
            // Arrange
            var context = CreateInMemoryContext();
            var service = new PostService(context);
            var dto = new CreatePostDto
            {
                Content = "Test post content",
                Hashtags = new List<string> { "test" }
            };

            // Act
            var (success, message) = await service.CreatePostAsync(dto, "user123");

            // Assert
            Assert.True(success);
            Assert.Equal("Tạo bài viết thành công", message);
            Assert.Equal(1, await context.Posts.CountAsync());
        }

        [Fact]
        public async Task GetPosts_ReturnsOnlyNonDeletedPosts()
        {
            // Arrange
            var context = CreateInMemoryContext();

            // Thêm user giả vào context
            var user = new AppUser
            {
                Id = "user1",
                UserName = "testuser",
                FullName = "Test User",
                Email = "test@test.com"
            };
            context.Users.Add(user);

            context.Posts.AddRange(
                new Post { Id = 1, Content = "Post 1", UserId = "user1", IsDeleted = false },
                new Post { Id = 2, Content = "Post 2", UserId = "user1", IsDeleted = true },
                new Post { Id = 3, Content = "Post 3", UserId = "user1", IsDeleted = false }
            );
            await context.SaveChangesAsync();

            var service = new PostService(context);

            // Act
            var posts = await service.GetPostsAsync(1, 10, "user1");

            // Assert
            Assert.Equal(2, posts.Count);
        }

        [Fact]
        public async Task DeletePost_WrongUser_ReturnsFail()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Posts.Add(new Post
            {
                Id = 1,
                Content = "Test",
                UserId = "owner123",
                IsDeleted = false
            });
            await context.SaveChangesAsync();

            var service = new PostService(context);

            // Act
            var (success, message) = await service.DeletePostAsync(1, "hacker456");

            // Assert
            Assert.False(success);
            Assert.Equal("Không tìm thấy bài viết", message);
        }

        [Fact]
        public async Task DeletePost_CorrectUser_ReturnsSuccess()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Posts.Add(new Post
            {
                Id = 1,
                Content = "Test",
                UserId = "user123",
                IsDeleted = false
            });
            await context.SaveChangesAsync();

            var service = new PostService(context);

            // Act
            var (success, message) = await service.DeletePostAsync(1, "user123");

            // Assert
            Assert.True(success);
            Assert.Equal("Xóa thành công", message);
        }

        [Fact]
        public async Task ToggleLike_FirstLike_AddsLike()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Posts.Add(new Post { Id = 1, Content = "Test", UserId = "user1" });
            await context.SaveChangesAsync();

            var service = new PostService(context);

            // Act
            var (success, message) = await service.ToggleLikeAsync(1, "user2");

            // Assert
            Assert.True(success);
            Assert.Equal("Đã like", message);
            Assert.Equal(1, await context.Likes.CountAsync());
        }

        [Fact]
        public async Task ToggleLike_SecondLike_RemovesLike()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Posts.Add(new Post { Id = 1, Content = "Test", UserId = "user1" });
            context.Likes.Add(new Like { PostId = 1, UserId = "user2" });
            await context.SaveChangesAsync();

            var service = new PostService(context);

            // Act
            var (success, message) = await service.ToggleLikeAsync(1, "user2");

            // Assert
            Assert.True(success);
            Assert.Equal("Đã bỏ like", message);
            Assert.Equal(0, await context.Likes.CountAsync());
        }

        [Fact]
        public async Task UpdatePost_ValidUser_ReturnsSuccess()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Posts.Add(new Post
            {
                Id = 1, Content = "Original", ImageUrl = null,
                UserId = "user1", IsDeleted = false
            });
            await context.SaveChangesAsync();

            var service = new PostService(context);
            var dto = new UpdatePostDto { Content = "Updated content", ImageUrl = "https://img.url" };

            // Act
            var (success, message) = await service.UpdatePostAsync(1, dto, "user1");

            // Assert
            Assert.True(success);
            Assert.Equal("Cập nhật thành công", message);

            var post = await context.Posts.FindAsync(1);
            Assert.Equal("Updated content", post!.Content);
            Assert.Equal("https://img.url", post.ImageUrl);
        }

        [Fact]
        public async Task UpdatePost_WrongUser_ReturnsFail()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Posts.Add(new Post
            {
                Id = 1, Content = "Original", UserId = "owner", IsDeleted = false
            });
            await context.SaveChangesAsync();

            var service = new PostService(context);
            var dto = new UpdatePostDto { Content = "Hacked" };

            // Act
            var (success, message) = await service.UpdatePostAsync(1, dto, "hacker");

            // Assert
            Assert.False(success);
            Assert.Equal("Không tìm thấy bài viết", message);
        }

        [Fact]
        public async Task GetPostById_ExistingPost_ReturnsDto()
        {
            // Arrange
            var context = CreateInMemoryContext();
            var user = new AppUser
            {
                Id = "user1", UserName = "testuser",
                Email = "t@x.com", FullName = "Test User"
            };
            context.Users.Add(user);
            context.Posts.Add(new Post
            {
                Id = 1, Content = "Hello", UserId = "user1", IsDeleted = false
            });
            await context.SaveChangesAsync();

            var service = new PostService(context);

            // Act
            var result = await service.GetPostByIdAsync(1, "user1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
            Assert.Equal("Hello", result.Content);
        }

        [Fact]
        public async Task GetPostById_DeletedPost_ReturnsNull()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Posts.Add(new Post
            {
                Id = 1, Content = "Deleted", UserId = "user1", IsDeleted = true
            });
            await context.SaveChangesAsync();

            var service = new PostService(context);

            // Act
            var result = await service.GetPostByIdAsync(1, "user1");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreatePost_WithExistingHashtag_ReusesHashtag()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Hashtags.Add(new Hashtag { Id = 1, Name = "dotnet", UseCount = 5 });
            await context.SaveChangesAsync();

            var service = new PostService(context);
            var dto = new CreatePostDto
            {
                Content = "Post with existing hashtag",
                Hashtags = new List<string> { "dotnet" }
            };

            // Act
            var (success, _) = await service.CreatePostAsync(dto, "user1");

            // Assert
            Assert.True(success);
            Assert.Equal(1, await context.Hashtags.CountAsync()); // không tạo mới
            var hashtag = await context.Hashtags.FirstAsync();
            Assert.Equal(6, hashtag.UseCount); // tăng thêm 1
        }
    }
}