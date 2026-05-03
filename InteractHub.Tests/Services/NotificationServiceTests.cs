using InteractHub.API.Data;
using InteractHub.API.Models.Entities;
using InteractHub.API.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace InteractHub.Tests.Services
{
    public class NotificationServiceTests
    {
        private AppDbContext CreateInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task CreateNotification_ValidData_SavesCorrectly()
        {
            var context = CreateInMemoryContext();
            var service = new NotificationService(context);

            await service.CreateNotificationAsync("user1", "Test message", "like", "post123");

            var notification = await context.Notifications.FirstAsync();
            Assert.Equal("user1", notification.UserId);
            Assert.Equal("Test message", notification.Message);
            Assert.Equal("like", notification.Type);
            Assert.False(notification.IsRead);
        }

        [Fact]
        public async Task MarkAsRead_ValidNotification_ReturnsSuccess()
        {
            var context = CreateInMemoryContext();
            context.Notifications.Add(new Notification
            {
                Id = 1,
                UserId = "user1",
                Message = "Test",
                Type = "like",
                IsRead = false
            });
            await context.SaveChangesAsync();

            var service = new NotificationService(context);
            var (success, message) = await service.MarkAsReadAsync(1, "user1");

            Assert.True(success);
            var notification = await context.Notifications.FirstAsync();
            Assert.True(notification.IsRead);
        }

        [Fact]
        public async Task MarkAsRead_WrongUser_ReturnsFail()
        {
            var context = CreateInMemoryContext();
            context.Notifications.Add(new Notification
            {
                Id = 1,
                UserId = "user1",
                Message = "Test",
                Type = "like",
                IsRead = false
            });
            await context.SaveChangesAsync();

            var service = new NotificationService(context);
            var (success, message) = await service.MarkAsReadAsync(1, "hacker");

            Assert.False(success);
            Assert.Equal("Không tìm thấy thông báo", message);
        }

        [Fact]
        public async Task MarkAllAsRead_MarksAllUnread()
        {
            var context = CreateInMemoryContext();
            context.Notifications.AddRange(
                new Notification { Id = 1, UserId = "user1", Message = "A", Type = "like", IsRead = false },
                new Notification { Id = 2, UserId = "user1", Message = "B", Type = "comment", IsRead = false },
                new Notification { Id = 3, UserId = "user1", Message = "C", Type = "friend", IsRead = true }
            );
            await context.SaveChangesAsync();

            var service = new NotificationService(context);
            await service.MarkAllAsReadAsync("user1");

            var unread = await context.Notifications
                .CountAsync(n => n.UserId == "user1" && !n.IsRead);
            Assert.Equal(0, unread);
        }

        [Fact]
        public async Task GetNotifications_ReturnsOnlyUserNotifications()
        {
            var context = CreateInMemoryContext();
            context.Notifications.AddRange(
                new Notification { Id = 1, UserId = "user1", Message = "A", Type = "like" },
                new Notification { Id = 2, UserId = "user2", Message = "B", Type = "like" },
                new Notification { Id = 3, UserId = "user1", Message = "C", Type = "comment" }
            );
            await context.SaveChangesAsync();

            var service = new NotificationService(context);
            var result = await service.GetNotificationsAsync("user1");

            Assert.Equal(2, result.Count);
        }
    }
}