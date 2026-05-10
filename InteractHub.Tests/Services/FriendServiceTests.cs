using InteractHub.API.Data;
using InteractHub.API.Models.Entities;
using InteractHub.API.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace InteractHub.Tests.Services
{
    public class FriendServiceTests
    {
        private AppDbContext CreateInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task SendRequest_ToSelf_ReturnsFail()
        {
            var context = CreateInMemoryContext();
            var service = new FriendService(context);

            var (success, message) = await service.SendRequestAsync("user1", "user1");

            Assert.False(success);
            Assert.Equal("Không thể kết bạn với chính mình", message);
        }

        [Fact]
        public async Task SendRequest_NewRequest_ReturnsSuccess()
        {
            var context = CreateInMemoryContext();
            var service = new FriendService(context);

            var (success, message) = await service.SendRequestAsync("user1", "user2");

            Assert.True(success);
            Assert.Equal("Đã gửi lời mời kết bạn", message);
            Assert.Equal(1, await context.Friendships.CountAsync());
        }

        [Fact]
        public async Task SendRequest_Duplicate_ReturnsFail()
        {
            var context = CreateInMemoryContext();
            context.Friendships.Add(new Friendship
            {
                SenderId = "user1",
                ReceiverId = "user2",
                Status = FriendshipStatus.Pending
            });
            await context.SaveChangesAsync();

            var service = new FriendService(context);
            var (success, message) = await service.SendRequestAsync("user1", "user2");

            Assert.False(success);
            Assert.Equal("Đã gửi lời mời hoặc đã là bạn bè", message);
        }

        [Fact]
        public async Task AcceptRequest_ValidRequest_ReturnsSuccess()
        {
            var context = CreateInMemoryContext();
            context.Friendships.Add(new Friendship
            {
                SenderId = "user1",
                ReceiverId = "user2",
                Status = FriendshipStatus.Pending
            });
            await context.SaveChangesAsync();

            var service = new FriendService(context);
            var (success, message) = await service.AcceptRequestAsync("user1", "user2");

            Assert.True(success);
            Assert.Equal("Đã chấp nhận lời mời", message);

            var friendship = await context.Friendships.FirstAsync();
            Assert.Equal(FriendshipStatus.Accepted, friendship.Status);
        }

        [Fact]
        public async Task RejectRequest_ValidRequest_ReturnsSuccess()
        {
            var context = CreateInMemoryContext();
            context.Friendships.Add(new Friendship
            {
                SenderId = "user1",
                ReceiverId = "user2",
                Status = FriendshipStatus.Pending
            });
            await context.SaveChangesAsync();

            var service = new FriendService(context);
            var (success, message) = await service.RejectRequestAsync("user1", "user2");

            Assert.True(success);
            Assert.Equal("Đã từ chối lời mời", message);

            var friendship = await context.Friendships.FirstAsync();
            Assert.Equal(FriendshipStatus.Rejected, friendship.Status);
        }

        [Fact]
        public async Task AcceptRequest_NotFound_ReturnsFail()
        {
            // Arrange — không có friendship nào
            var context = CreateInMemoryContext();
            var service = new FriendService(context);

            // Act
            var (success, message) = await service.AcceptRequestAsync("user1", "user2");

            // Assert
            Assert.False(success);
            Assert.Equal("Không tìm thấy lời mời kết bạn", message);
        }

        [Fact]
        public async Task RejectRequest_NotFound_ReturnsFail()
        {
            // Arrange — không có friendship nào
            var context = CreateInMemoryContext();
            var service = new FriendService(context);

            // Act
            var (success, message) = await service.RejectRequestAsync("user1", "user2");

            // Assert
            Assert.False(success);
            Assert.Equal("Không tìm thấy lời mời kết bạn", message);
        }

        [Fact]
        public async Task GetFriends_ReturnsOnlyAcceptedFriends()
        {
            // Arrange
            var context = CreateInMemoryContext();
            var user1 = new AppUser { Id = "user1", UserName = "u1", Email = "u1@x.com", FullName = "User1" };
            var user2 = new AppUser { Id = "user2", UserName = "u2", Email = "u2@x.com", FullName = "User2" };
            var user3 = new AppUser { Id = "user3", UserName = "u3", Email = "u3@x.com", FullName = "User3" };
            context.Users.AddRange(user1, user2, user3);
            context.Friendships.AddRange(
                new Friendship { SenderId = "user1", ReceiverId = "user2", Status = FriendshipStatus.Accepted },
                new Friendship { SenderId = "user3", ReceiverId = "user1", Status = FriendshipStatus.Pending }
            );
            await context.SaveChangesAsync();

            var service = new FriendService(context);

            // Act
            var friends = await service.GetFriendsAsync("user1");

            // Assert
            Assert.Single(friends); // chỉ user2 là Accepted
        }

        [Fact]
        public async Task GetPendingRequests_ReturnsPendingForReceiver()
        {
            // Arrange
            var context = CreateInMemoryContext();
            var sender1 = new AppUser { Id = "sender1", UserName = "s1", Email = "s1@x.com", FullName = "S1" };
            var sender2 = new AppUser { Id = "sender2", UserName = "s2", Email = "s2@x.com", FullName = "S2" };
            context.Users.AddRange(sender1, sender2);
            context.Friendships.AddRange(
                new Friendship { SenderId = "sender1", ReceiverId = "user1", Status = FriendshipStatus.Pending },
                new Friendship { SenderId = "sender2", ReceiverId = "user1", Status = FriendshipStatus.Pending },
                new Friendship { SenderId = "sender1", ReceiverId = "user2", Status = FriendshipStatus.Pending }
            );
            await context.SaveChangesAsync();

            var service = new FriendService(context);

            // Act
            var pending = await service.GetPendingRequestsAsync("user1");

            // Assert
            Assert.Equal(2, pending.Count); // chỉ lấy pending của user1 làm receiver
        }

        [Fact]
        public async Task SendRequest_ReverseDirection_ReturnsFail()
        {
            // Arrange — user2 đã gửi request cho user1 trước rồi
            var context = CreateInMemoryContext();
            context.Friendships.Add(new Friendship
            {
                SenderId = "user2",
                ReceiverId = "user1",
                Status = FriendshipStatus.Pending
            });
            await context.SaveChangesAsync();

            var service = new FriendService(context);

            // Act — user1 cố gửi ngược lại
            var (success, message) = await service.SendRequestAsync("user1", "user2");

            // Assert
            Assert.False(success);
            Assert.Equal("Đã gửi lời mời hoặc đã là bạn bè", message);
        }
    }
}