using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteractHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentPermission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CommentPermission",
                table: "Posts",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommentPermission",
                table: "Posts");
        }
    }
}
