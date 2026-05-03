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
    }
}