using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Mime;
using System.Text.Json;
using System.Threading.Tasks;
using Jellyfin.Plugin.Rating.Data;
using Jellyfin.Plugin.Rating.Models;
using MediaBrowser.Common.Configuration;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.Rating.Api
{
    public class RateRequest
    {
        public Guid ItemId { get; set; }
        public Guid UserId { get; set; }
        public int Rating { get; set; }
        public string? UserName { get; set; }
        public string? ItemName { get; set; }
        public string? Synopsis { get; set; }
        public string? HeaderSynopsis { get; set; }
        public List<string>? Genres { get; set; }
        public List<string>? Studios { get; set; }
        public List<string>? Screenwriters { get; set; }
        public List<Dictionary<string, string>>? Cast { get; set; }
        public string? TmdbId { get; set; }
        public string? PosterUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? MediaType { get; set; }
    }

    public class SeerrRequestBody
    {
        public int TmdbId { get; set; }
        public string MediaType { get; set; } = "movie";
        public string JellyfinUserId { get; set; } = "";
        public int[]? Seasons { get; set; }
    }

    [ApiController]
    [Route("api/MediaRating")]
    public class RatingsController : ControllerBase
    {
        private readonly RatingRepository _repository;
        private readonly IHttpClientFactory _http_factory;

        private static readonly int[] _valid_ratings = { -1, 1, 2 };

        public RatingsController(IApplicationPaths app_paths, IHttpClientFactory http_factory)
        {
            _repository   = new RatingRepository(app_paths);
            _http_factory = http_factory;
        }

        private async Task<(bool ok, int status, string body)> _call_seerr(string path, string? base_url = null, string? api_key = null)
        {
            if (string.IsNullOrWhiteSpace(base_url) || string.IsNullOrWhiteSpace(api_key))
            {
                var config = Plugin.Instance?.Configuration;
                base_url = base_url ?? config?.SeerrUrl;
                api_key  = api_key  ?? config?.SeerrApiKey;
            }
            if (string.IsNullOrWhiteSpace(base_url) || string.IsNullOrWhiteSpace(api_key))
                return (false, 0, "Seerr non configuré (URL ou clé API manquante)");

            var url = base_url.TrimEnd('/') + path;
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("X-Api-Key", api_key);

            try
            {
                using var client = _http_factory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(10);
                using var response = await client.SendAsync(request);
                var body = await response.Content.ReadAsStringAsync();
                return (response.IsSuccessStatusCode, (int)response.StatusCode, body);
            }
            catch (Exception ex)
            {
                return (false, 0, ex.Message);
            }
        }

        // GET /api/MediaRating/SeerrTest?url=...&apiKey=...
        [HttpGet("SeerrTest")]
        [Produces(MediaTypeNames.Application.Json)]
        public async Task<ActionResult> seerr_test([FromQuery] string? url = null, [FromQuery] string? apiKey = null)
        {
            var (ok, status, body) = await _call_seerr("/api/v1/status", url, apiKey);
            if (!ok)
                return Ok(new { success = false, message = status > 0 ? $"HTTP {status}" : body });

            string? version = null;
            try
            {
                using var doc = JsonDocument.Parse(body);
                if (doc.RootElement.TryGetProperty("version", out var v))
                    version = v.GetString();
            }
            catch { /* version best-effort */ }

            return Ok(new { success = true, version });
        }

        // GET /api/MediaRating/SeerrSearch?query=...
        [HttpGet("SeerrSearch")]
        [Produces(MediaTypeNames.Application.Json)]
        public async Task<ActionResult> seerr_search([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return Ok(new { success = true, results = Array.Empty<object>() });

            var encoded = Uri.EscapeDataString(query);
            var (ok, status, body) = await _call_seerr($"/api/v1/search?query={encoded}");
            if (!ok)
                return Ok(new { success = false, message = status > 0 ? $"HTTP {status}" : body });

            var results = new List<object>();
            try
            {
                using var doc = JsonDocument.Parse(body);
                if (!doc.RootElement.TryGetProperty("results", out var items)) return Ok(new { success = true, results });

                foreach (var item in items.EnumerateArray())
                {
                    var media_type = item.TryGetProperty("mediaType", out var mt) ? mt.GetString() : null;
                    if (media_type != "movie" && media_type != "tv") continue;

                    var title = media_type == "movie"
                        ? (item.TryGetProperty("title", out var t) ? t.GetString() : null)
                        : (item.TryGetProperty("name",  out var n) ? n.GetString() : null);

                    var date = media_type == "movie"
                        ? (item.TryGetProperty("releaseDate",  out var rd) ? rd.GetString() : null)
                        : (item.TryGetProperty("firstAirDate", out var fa) ? fa.GetString() : null);

                    var poster_path = item.TryGetProperty("posterPath", out var pp) ? pp.GetString() : null;
                    var poster_url  = string.IsNullOrEmpty(poster_path) ? null : $"https://image.tmdb.org/t/p/w500{poster_path}";

                    results.Add(new
                    {
                        id         = item.TryGetProperty("id", out var id) ? id.GetInt32() : 0,
                        media_type,
                        title,
                        year       = (date != null && date.Length >= 4) ? date.Substring(0, 4) : null,
                        poster_url
                    });
                }
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Parse error : {ex.Message}" });
            }

            return Ok(new { success = true, results });
        }

        // GET /api/MediaRating/SeerrDetails?id=...&mediaType=movie|tv
        [HttpGet("SeerrDetails")]
        [Produces(MediaTypeNames.Application.Json)]
        public async Task<ActionResult> seerr_details([FromQuery] int id, [FromQuery] string mediaType)
        {
            if (mediaType != "movie" && mediaType != "tv")
                return Ok(new { success = false, message = "mediaType doit être 'movie' ou 'tv'" });

            var (ok, status, body) = await _call_seerr($"/api/v1/{mediaType}/{id}");
            if (!ok)
                return Ok(new { success = false, message = status > 0 ? $"HTTP {status}" : body });

            try
            {
                using var doc = JsonDocument.Parse(body);
                return Ok(new { success = true, data = doc.RootElement.Clone() });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Parse error : {ex.Message}" });
            }
        }

        // POST /api/MediaRating/SeerrRequest
        [HttpPost("SeerrRequest")]
        [Produces(MediaTypeNames.Application.Json)]
        public async Task<ActionResult> seerr_request([FromBody] SeerrRequestBody body)
        {
            if (body.TmdbId <= 0 || (body.MediaType != "movie" && body.MediaType != "tv"))
                return Ok(new { success = false, message = "Paramètres invalides" });
            if (string.IsNullOrWhiteSpace(body.JellyfinUserId))
                return Ok(new { success = false, message = "JellyfinUserId manquant" });

            var config = Plugin.Instance?.Configuration;
            var base_url = config?.SeerrUrl;
            var api_key  = config?.SeerrApiKey;
            if (string.IsNullOrWhiteSpace(base_url) || string.IsNullOrWhiteSpace(api_key))
                return Ok(new { success = false, message = "Seerr non configuré" });

            var seerr_user_id = await _find_seerr_user_id(body.JellyfinUserId);
            if (seerr_user_id == null)
                return Ok(new { success = false, message = "Aucun compte Jellyseerr lié à ton compte Jellyfin. Contacte l'admin." });

            var url = base_url.TrimEnd('/') + "/api/v1/request";
            using var req = new HttpRequestMessage(HttpMethod.Post, url);
            req.Headers.Add("X-Api-Key", api_key);
            req.Headers.Add("X-Api-User", seerr_user_id.ToString());

            object payload;
            if (body.MediaType == "tv")
            {
                var clean_seasons = body.Seasons?.Where(s => s > 0).Distinct().ToArray() ?? Array.Empty<int>();
                object seasons_value = clean_seasons.Length > 0 ? (object)clean_seasons : (object)"all";
                payload = new { mediaType = body.MediaType, mediaId = body.TmdbId, seasons = seasons_value };
            }
            else
            {
                payload = new { mediaType = body.MediaType, mediaId = body.TmdbId };
            }
            req.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

            try
            {
                using var client = _http_factory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(15);
                using var response = await client.SendAsync(req);
                var rbody = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                    return Ok(new { success = false, message = $"HTTP {(int)response.StatusCode} : {rbody}" });
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = ex.Message });
            }
        }

        private async Task<int?> _find_seerr_user_id(string jellyfin_user_id)
        {
            var (ok, _, body) = await _call_seerr("/api/v1/user?take=200");
            if (!ok) return null;
            try
            {
                using var doc = JsonDocument.Parse(body);
                if (!doc.RootElement.TryGetProperty("results", out var results)) return null;
                var target = jellyfin_user_id.Replace("-", "");
                foreach (var u in results.EnumerateArray())
                {
                    if (!u.TryGetProperty("jellyfinUserId", out var jid) || jid.ValueKind != JsonValueKind.String) continue;
                    var current = (jid.GetString() ?? "").Replace("-", "");
                    if (string.Equals(current, target, StringComparison.OrdinalIgnoreCase))
                        return u.TryGetProperty("id", out var idEl) ? idEl.GetInt32() : (int?)null;
                }
            }
            catch { }
            return null;
        }

        // GET /api/MediaRating/TmdbImages?id=...&mediaType=movie|tv
        [HttpGet("TmdbImages")]
        [Produces(MediaTypeNames.Application.Json)]
        public async Task<ActionResult> tmdb_images([FromQuery] int id, [FromQuery] string mediaType)
        {
            if (mediaType != "movie" && mediaType != "tv")
                return Ok(new { success = false, message = "mediaType doit être 'movie' ou 'tv'" });

            var key = Plugin.Instance?.Configuration?.TmdbApiKey;
            if (string.IsNullOrWhiteSpace(key))
                return Ok(new { success = false, message = "Clé API TMDB non configurée" });

            var url = $"https://api.themoviedb.org/3/{mediaType}/{id}/images?include_image_language=fr,en,null&api_key={key}";

            try
            {
                using var client = _http_factory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(10);
                using var response = await client.GetAsync(url);
                var body = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                    return Ok(new { success = false, message = $"HTTP {(int)response.StatusCode}" });

                using var doc = JsonDocument.Parse(body);
                return Ok(new { success = true, data = doc.RootElement.Clone() });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = ex.Message });
            }
        }

        // POST /api/MediaRating/Rate  (body JSON)
        [HttpPost("Rate")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult rate_item([FromBody] RateRequest req)
        {
            if (!_valid_ratings.Contains(req.Rating))
                return BadRequest(new { success = false, message = "Rating must be -1, 1 or 2" });

            if (req.ItemId == Guid.Empty && string.IsNullOrWhiteSpace(req.TmdbId))
                return BadRequest(new { success = false, message = "ItemId ou TmdbId requis" });

            _repository.save_rating(new UserRating
            {
                ItemId         = req.ItemId,
                UserId         = req.UserId,
                UserName       = req.UserName ?? "Unknown",
                ItemName       = req.ItemName ?? "Unknown",
                Rating         = req.Rating,
                Timestamp      = DateTime.UtcNow,
                Synopsis       = req.Synopsis,
                HeaderSynopsis = req.HeaderSynopsis,
                Genres         = req.Genres ?? new(),
                Studios        = req.Studios ?? new(),
                Screenwriters  = req.Screenwriters ?? new(),
                Cast           = req.Cast ?? new(),
                TmdbId         = req.TmdbId,
                PosterUrl      = req.PosterUrl,
                LogoUrl        = req.LogoUrl,
                InLibrary      = req.ItemId != Guid.Empty,
                MediaType      = req.MediaType
            });

            return Ok(new { success = true });
        }

        // GET /api/MediaRating/MyRating/{itemId}?userId=...&tmdbId=...
        [HttpGet("MyRating/{itemId}")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult get_my_rating(Guid itemId, [FromQuery] Guid userId, [FromQuery] string? tmdbId = null)
        {
            if (itemId != Guid.Empty)
            {
                var native = _repository.get_rating(itemId, userId);
                if (native != null) return Ok(new { success = true, rating = native.Rating });
            }

            if (string.IsNullOrWhiteSpace(tmdbId))
                return Ok(new { success = true, rating = (int?)null });

            var orphan = _repository.get_rating_by_tmdb(tmdbId, userId);
            if (orphan == null) return Ok(new { success = true, rating = (int?)null });

            if (itemId != Guid.Empty)
                _repository.migrate_to_item_id(tmdbId, userId, itemId);

            return Ok(new { success = true, rating = orphan.Rating });
        }

        // DELETE /api/MediaRating/Rating?itemId=...&userId=...&tmdbId=...
        [HttpDelete("Rating")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult delete_rating([FromQuery] Guid itemId, [FromQuery] Guid userId, [FromQuery] string? tmdbId = null)
        {
            if (itemId == Guid.Empty && !string.IsNullOrWhiteSpace(tmdbId))
            {
                _repository.delete_orphan_by_tmdb(tmdbId, userId);
                return Ok(new { success = true });
            }

            _repository.delete_rating(itemId, userId);
            return Ok(new { success = true });
        }

        // GET /api/MediaRating/User/{userId}
        [HttpGet("User/{userId}")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult get_user_ratings(Guid userId)
        {
            var ratings = _repository.get_ratings_for_user(userId);
            return Ok(new
            {
                success = true,
                ratings = ratings.Select(r => new
                {
                    item_id         = r.ItemId,
                    item_name       = r.ItemName,
                    rating          = r.Rating,
                    timestamp       = r.Timestamp,
                    synopsis        = r.Synopsis,
                    header_synopsis = r.HeaderSynopsis,
                    genres          = r.Genres,
                    studios         = r.Studios,
                    screenwriters   = r.Screenwriters,
                    cast            = r.Cast,
                    tmdb_id         = r.TmdbId,
                    poster_url      = r.PosterUrl,
                    logo_url        = r.LogoUrl,
                    in_library      = r.InLibrary,
                    media_type      = r.MediaType
                })
            });
        }
    }
}
