using System;

namespace Jellyfin.Plugin.Rating.Models
{
    public class UserRating
    {
        public Guid ItemId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = "Unknown";
        // Valeurs : -1 (dislike), 1 (like), 2 (love)
        public int Rating { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
