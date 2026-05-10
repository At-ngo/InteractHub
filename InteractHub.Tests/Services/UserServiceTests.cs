using InteractHub.API.Data;
using InteractHub.API.DTOs.User;
using InteractHub.API.Models.Entities;
using InteractHub.API.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace InteractHub.Tests.Services
{
    public class UserServiceTests
    {
        private AppDbContext CreateInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        // ─── GetProfileAsync ───────────────────────────────────────────────

        [Fact]
        public async Task GetProfile_ExistingUser_ReturnsProfileDto()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Users.Add(new AppUser
            {
                Id = "user1",
                UserName = "testuser",
                Email = "test@example.com",
                FullName = "Test User",
                Bio = "Hello world",
                AvatarUrl = "https://avatar.url"
            });
            await context.SaveChangesAsync();

            var service = new UserService(context);

            // Act
            var result = await service.GetProfileAsync("user1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("user1", result.Id);
            Assert.Equal("testuser", result.Username);
            Assert.Equal("Test User", result.FullName);
            Assert.Equal("Hello world", result.Bio);
            Assert.Equal(0, result.PostCount);
            Assert.Equal(0, result.FriendCount);
        }

        [Fact]
        public async Task GetProfile_NonExistentUser_ReturnsNull()
        {
            // Arrange
            var context = CreateInMemoryContext();
            var service = new UserService(context);

            // Act
            var result = await service.GetProfileAsync("nonexistent");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetProfile_CountsOnlyNonDeletedPosts()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Users.Add(new AppUser
            {
                Id = "user1", UserName = "u1", Email = "u1@x.com", FullName = "U1"
            });
            context.Posts.AddRange(
                new Post { Id = 1, UserId = "user1", Content = "A", IsDeleted = false },
                new Post { Id = 2, UserId = "user1", Content = "B", IsDeleted = true },
                new Post { Id = 3, UserId = "user1", Content = "C", IsDeleted = false }
            );
            await context.SaveChangesAsync();

            var service = new UserService(context);

            // Act
            var result = await service.GetProfileAsync("user1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.PostCount);
        }

        [Fact]
        public async Task GetProfile_CountsAcceptedFriendsOnly()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Users.Add(new AppUser
            {
                Id = "user1", UserName = "u1", Email = "u1@x.com", FullName = "U1"
            });
            context.Friendships.AddRange(
                new Friendship { SenderId = "user1", ReceiverId = "user2", Status = FriendshipStatus.Accepted },
                new Friendship { SenderId = "user3", ReceiverId = "user1", Status = FriendshipStatus.Accepted },
                new Friendship { SenderId = "user1", ReceiverId = "user4", Status = FriendshipStatus.Pending }
            );
            await context.SaveChangesAsync();

            var service = new UserService(context);

            // Act
            var result = await service.GetProfileAsync("user1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.FriendCount);
        }

        // ─── UpdateProfileAsync ────────────────────────────────────────────

        [Fact]
        public async Task UpdateProfile_ValidUser_ReturnsSuccess()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Users.Add(new AppUser
            {
                Id = "user1", UserName = "u1", Email = "u1@x.com",
                FullName = "Old Name", Bio = "Old bio"
            });
            await context.SaveChangesAsync();

            var service = new UserService(context);
            var dto = new UpdateProfileDto
            {
                FullName = "New Name",
                Bio = "New bio",
                AvatarUrl = "https://new-avatar.url",
                CoverUrl = "https://new-cover.url"
            };

            // Act
            var (success, message) = await service.UpdateProfileAsync("user1", dto);

            // Assert
            Assert.True(success);
            Assert.Equal("Cập nhật thành công", message);

            var updated = await context.Users.FindAsync("user1");
            Assert.Equal("New Name", updated!.FullName);
            Assert.Equal("New bio", updated.Bio);
            Assert.Equal("https://new-avatar.url", updated.AvatarUrl);
            Assert.Equal("https://new-cover.url", updated.CoverUrl);
        }

        [Fact]
        public async Task UpdateProfile_NonExistentUser_ReturnsFail()
        {
            // Arrange
            var context = CreateInMemoryContext();
            var service = new UserService(context);
            var dto = new UpdateProfileDto { FullName = "Name", Bio = "Bio" };

            // Act
            var (success, message) = await service.UpdateProfileAsync("ghost", dto);

            // Assert
            Assert.False(success);
            Assert.Equal("Không tìm thấy user", message);
        }

        [Fact]
        public async Task UpdateProfile_NullAvatarUrl_DoesNotOverwriteExisting()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Users.Add(new AppUser
            {
                Id = "user1", UserName = "u1", Email = "u1@x.com",
                FullName = "Name", AvatarUrl = "https://existing-avatar.url"
            });
            await context.SaveChangesAsync();

            var service = new UserService(context);
            var dto = new UpdateProfileDto
            {
                FullName = "Updated Name",
                Bio = "Bio",
                AvatarUrl = null,   // không thay đổi
                CoverUrl = null     // không thay đổi
            };

            // Act
            var (success, _) = await service.UpdateProfileAsync("user1", dto);

            // Assert
            Assert.True(success);
            var user = await context.Users.FindAsync("user1");
            Assert.Equal("https://existing-avatar.url", user!.AvatarUrl); // phải giữ nguyên
        }

        // ─── SearchUsersAsync ─────────────────────────────────────────────

        [Fact]
        public async Task SearchUsers_MatchingQuery_ReturnsResults()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Users.AddRange(
                new AppUser { Id = "u1", UserName = "alice123",  Email = "a@x.com", FullName = "Alice Smith" },
                new AppUser { Id = "u2", UserName = "bob456",    Email = "b@x.com", FullName = "Bob Jones" },
                new AppUser { Id = "u3", UserName = "alice_ngo", Email = "c@x.com", FullName = "Nguyen Alice" }
            );
            await context.SaveChangesAsync();

            var service = new UserService(context);

            // Act — query "alice" khớp username của u1 và u3
            var result = await service.SearchUsersAsync("alice");

            // Assert
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task SearchUsers_NoMatch_ReturnsEmptyList()
        {
            // Arrange
            var context = CreateInMemoryContext();
            context.Users.Add(new AppUser
            {
                Id = "u1", UserName = "alice", Email = "a@x.com", FullName = "Alice"
            });
            await context.SaveChangesAsync();

            var service = new UserService(context);

            // Act
            var result = await service.SearchUsersAsync("xyz_no_match");

            // Assert
            Assert.Empty(result);
        }
    }
}
