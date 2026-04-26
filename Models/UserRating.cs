using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.Rating.Models
{
    public class UserRating
    {
        public Guid ItemId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = "Unknown";
        public string ItemName { get; set; } = "Unknown";
        // Valeurs : -1 (dislike), 1 (like), 2 (love)
        public int Rating { get; set; }
        public DateTime Timestamp { get; set; }

        public string? Synopsis { get; set; }
        public string? HeaderSynopsis { get; set; }
        public List<string> Genres { get; set; } = new();
        public List<string> Studios { get; set; } = new();
        public List<string> Screenwriters { get; set; } = new();
        public List<Dictionary<string, string>> Cast { get; set; } = new();
        public string? TmdbId { get; set; }
        public string? PosterUrl { get; set; }
        public string? LogoUrl { get; set; }
    }
}
