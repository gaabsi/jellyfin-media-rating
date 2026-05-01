using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Jellyfin.Plugin.Rating.Data;
using Jellyfin.Plugin.Rating.Models;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.Rating.Services
{
    public record ReleaseView(
        [property: JsonPropertyName("tmdbId")] string TmdbId,
        [property: JsonPropertyName("title")] string Title,
        [property: JsonPropertyName("releaseDate")] string? ReleaseDate
    );

    public record MonitoringView(
        [property: JsonPropertyName("id")] long Id,
        [property: JsonPropertyName("mediaType")] string MediaType,
        [property: JsonPropertyName("tmdbId")] string TmdbId,
        [property: JsonPropertyName("collectionId")] string? CollectionId,
        [property: JsonPropertyName("label")] string Label,
        [property: JsonPropertyName("released")] List<ReleaseView> Released,
        [property: JsonPropertyName("upcoming")] List<ReleaseView> Upcoming
    );

    public class MonitoringService
    {
        private readonly MonitoringRepository _repo;
        private readonly TmdbClient _tmdb;
        private readonly ILogger<MonitoringService> _logger;

        public MonitoringService(MonitoringRepository repo, TmdbClient tmdb, ILogger<MonitoringService> logger)
        {
            _repo = repo;
            _tmdb = tmdb;
            _logger = logger;
        }

        public async Task<long?> start_monitoring(string user_id, string tmdb_id, string media_type)
        {
            if (!int.TryParse(tmdb_id, out var tmdb_int)) return null;
            if (media_type != "movie" && media_type != "series") return null;

            string label;
            string? collection_id = null;

            if (media_type == "movie")
            {
                var movie = await _tmdb.get_movie(tmdb_int);
                if (movie == null) return null;
                if (movie.BelongsToCollection != null)
                {
                    collection_id = movie.BelongsToCollection.Id.ToString();
                    label = movie.BelongsToCollection.Name;
                }
                else
                {
                    label = movie.Title;
                }
            }
            else
            {
                var tv = await _tmdb.get_tv(tmdb_int);
                if (tv == null) return null;
                label = tv.Name;
            }

            var row = new MonitoringRow
            {
                UserId = user_id,
                MediaType = media_type,
                TmdbId = tmdb_id,
                CollectionId = collection_id,
                Label = label,
                CreatedAt = DateTime.UtcNow,
            };
            var id = _repo.insert_monitoring(row);
            await refresh_one(id);
            return id;
        }

        public bool stop_monitoring(long monitoring_id, string user_id) =>
            _repo.delete_monitoring(monitoring_id, user_id);

        public async Task<bool> refresh_one(long monitoring_id)
        {
            var m = _repo.get_monitoring(monitoring_id);
            if (m == null) return false;

            var releases = await _fetch_releases(m);
            if (releases == null) return false;

            _repo.upsert_releases(monitoring_id, releases);
            _repo.touch_last_checked(monitoring_id, DateTime.UtcNow);
            return true;
        }

        public async Task refresh_all()
        {
            foreach (var m in _repo.list_all_monitoring())
            {
                try { await refresh_one(m.Id); }
                catch (Exception ex) { _logger.LogError(ex, "[Monitoring] refresh failed for {Id}", m.Id); }
            }
        }

        public List<MonitoringView> list_for_user(string user_id)
        {
            var today = DateTime.UtcNow.Date;
            var result = new List<MonitoringView>();

            foreach (var m in _repo.list_monitoring_for_user(user_id))
            {
                var released = new List<ReleaseView>();
                var upcoming = new List<ReleaseView>();

                foreach (var r in _repo.list_releases(m.Id))
                {
                    var view = new ReleaseView(r.TmdbId, r.Title, r.ReleaseDate);
                    if (_is_released(r.ReleaseDate, today))
                        released.Add(view);
                    else
                        upcoming.Add(view);
                }

                result.Add(new MonitoringView(m.Id, m.MediaType, m.TmdbId, m.CollectionId, m.Label, released, upcoming));
            }
            return result;
        }

        private static bool _is_released(string? release_date, DateTime today) =>
            !string.IsNullOrEmpty(release_date)
            && DateTime.TryParse(release_date, out var d)
            && d.Date <= today;

        private async Task<List<ReleaseRow>?> _fetch_releases(MonitoringRow m)
        {
            var now = DateTime.UtcNow;

            if (m.MediaType == "movie")
            {
                if (!string.IsNullOrEmpty(m.CollectionId) && int.TryParse(m.CollectionId, out var cid))
                {
                    var col = await _tmdb.get_collection(cid);
                    if (col == null) return null;
                    return col.Parts.Select(p => new ReleaseRow
                    {
                        TmdbId = p.Id.ToString(),
                        Title = p.Title,
                        ReleaseDate = string.IsNullOrEmpty(p.ReleaseDate) ? null : p.ReleaseDate,
                        SeenAt = now,
                    }).ToList();
                }

                // Film standalone : on snapshot juste lui-même.
                // TODO : refetch movie pour détecter si une collection est apparue depuis.
                if (!int.TryParse(m.TmdbId, out var mid)) return null;
                var movie = await _tmdb.get_movie(mid);
                if (movie == null) return null;
                return new List<ReleaseRow>
                {
                    new()
                    {
                        TmdbId = movie.Id.ToString(),
                        Title = movie.Title,
                        ReleaseDate = string.IsNullOrEmpty(movie.ReleaseDate) ? null : movie.ReleaseDate,
                        SeenAt = now,
                    }
                };
            }

            // Série : on liste les épisodes de chaque saison (saison 0 = specials, on ignore).
            if (!int.TryParse(m.TmdbId, out var tid)) return null;
            var tv = await _tmdb.get_tv(tid);
            if (tv == null) return null;

            var rows = new List<ReleaseRow>();
            foreach (var s in tv.Seasons.Where(x => x.SeasonNumber > 0))
            {
                var details = await _tmdb.get_tv_season(tid, s.SeasonNumber);
                if (details == null) continue;
                foreach (var ep in details.Episodes)
                {
                    rows.Add(new ReleaseRow
                    {
                        TmdbId = ep.Id.ToString(),
                        Title = $"S{ep.SeasonNumber:00}E{ep.EpisodeNumber:00} — {ep.Name}",
                        ReleaseDate = string.IsNullOrEmpty(ep.AirDate) ? null : ep.AirDate,
                        SeenAt = now,
                    });
                }
            }
            return rows;
        }
    }
}
