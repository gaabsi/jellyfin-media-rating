using System;

namespace Jellyfin.Plugin.Rating.Models
{
    public class MonitoringRow
    {
        public long Id { get; set; }
        public string UserId { get; set; } = "";
        // Valeurs : "movie" | "series"
        public string MediaType { get; set; } = "";
        public string TmdbId { get; set; } = "";
        public string? CollectionId { get; set; }
        public string Label { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public DateTime? LastCheckedAt { get; set; }
    }

    public class ReleaseRow
    {
        public long Id { get; set; }
        public long MonitoringId { get; set; }
        public string TmdbId { get; set; } = "";
        public string Title { get; set; } = "";
        // null = TBA (date non annoncée)
        public string? ReleaseDate { get; set; }
        public DateTime SeenAt { get; set; }
    }
}
