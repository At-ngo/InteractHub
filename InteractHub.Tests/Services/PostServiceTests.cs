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
    }
}