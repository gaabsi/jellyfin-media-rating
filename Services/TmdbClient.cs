using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.Rating.Services
{
    public record TmdbCollectionRef(
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("name")] string Name
    );

    public record TmdbMovie(
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("title")] string Title,
        [property: JsonPropertyName("release_date")] string? ReleaseDate,
        [property: JsonPropertyName("belongs_to_collection")] TmdbCollectionRef? BelongsToCollection
    );

    public record TmdbCollectionPart(
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("title")] string Title,
        [property: JsonPropertyName("release_date")] string? ReleaseDate
    );

    public record TmdbCollection(
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("parts")] List<TmdbCollectionPart> Parts
    );

    public record TmdbSeason(
        [property: JsonPropertyName("season_number")] int SeasonNumber,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("air_date")] string? AirDate,
        [property: JsonPropertyName("episode_count")] int EpisodeCount
    );

    public record TmdbTv(
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("status")] string? Status,
        [property: JsonPropertyName("seasons")] List<TmdbSeason> Seasons
    );

    public record TmdbEpisode(
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("season_number")] int SeasonNumber,
        [property: JsonPropertyName("episode_number")] int EpisodeNumber,
        [property: JsonPropertyName("air_date")] string? AirDate
    );

    public record TmdbSeasonDetails(
        [property: JsonPropertyName("season_number")] int SeasonNumber,
        [property: JsonPropertyName("episodes")] List<TmdbEpisode> Episodes
    );

    public class TmdbClient
    {
        private const string BASE_URL = "https://api.themoviedb.org/3";
        private readonly IHttpClientFactory _http_factory;
        private readonly ILogger<TmdbClient> _logger;

        public TmdbClient(IHttpClientFactory http_factory, ILogger<TmdbClient> logger)
        {
            _http_factory = http_factory;
            _logger = logger;
        }

        public Task<TmdbMovie?> get_movie(int tmdb_id) =>
            _fetch<TmdbMovie>($"/movie/{tmdb_id}");

        public Task<TmdbCollection?> get_collection(int collection_id) =>
            _fetch<TmdbCollection>($"/collection/{collection_id}");

        public Task<TmdbTv?> get_tv(int tmdb_id) =>
            _fetch<TmdbTv>($"/tv/{tmdb_id}");

        public Task<TmdbSeasonDetails?> get_tv_season(int tmdb_id, int season_number) =>
            _fetch<TmdbSeasonDetails>($"/tv/{tmdb_id}/season/{season_number}");

        private async Task<T?> _fetch<T>(string path) where T : class
        {
            var key = Plugin.Instance?.Configuration?.TmdbApiKey;
            if (string.IsNullOrWhiteSpace(key))
            {
                _logger.LogWarning("[Monitoring] Clé API TMDB non configurée");
                return null;
            }

            var url = $"{BASE_URL}{path}?api_key={key}&language=fr-FR";
            try
            {
                using var client = _http_factory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(10);
                using var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("[Monitoring] TMDB {Path} → HTTP {Code}", path, (int)response.StatusCode);
                    return null;
                }
                var body = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<T>(body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Monitoring] TMDB {Path} a échoué", path);
                return null;
            }
        }
    }
}
