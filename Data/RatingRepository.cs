using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Jellyfin.Plugin.Rating.Models;
using MediaBrowser.Common.Configuration;
using Microsoft.Data.Sqlite;

namespace Jellyfin.Plugin.Rating.Data
{
    public class RatingRepository
    {
        private readonly string _db_path;
        private readonly string _connection_string;

        public RatingRepository(IApplicationPaths app_paths)
        {
            var dir = Path.Combine(app_paths.PluginConfigurationsPath, "MediaRating");
            Directory.CreateDirectory(dir);
            _db_path = Path.Combine(dir, "ratings.db");
            _connection_string = $"Data Source={_db_path}";
            _init_schema();
        }

        private void _init_schema()
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS ratings (
                    item_id          TEXT NOT NULL,
                    user_id          TEXT NOT NULL,
                    user_name        TEXT NOT NULL DEFAULT 'Unknown',
                    item_name        TEXT NOT NULL DEFAULT 'Unknown',
                    rating           INTEGER NOT NULL,
                    timestamp        TEXT NOT NULL,
                    synopsis         TEXT,
                    header_synopsis  TEXT,
                    genres           TEXT,
                    studios          TEXT,
                    screenwriters    TEXT,
                    cast_json        TEXT,
                    tmdb_id          TEXT,
                    poster_url       TEXT,
                    logo_url         TEXT,
                    PRIMARY KEY (item_id, user_id)
                );
                CREATE INDEX IF NOT EXISTS idx_user ON ratings(user_id);
            ";
            cmd.ExecuteNonQuery();
        }

        public void save_rating(UserRating rating)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT OR REPLACE INTO ratings
                    (item_id, user_id, user_name, item_name, rating, timestamp,
                     synopsis, header_synopsis, genres, studios, screenwriters, cast_json,
                     tmdb_id, poster_url, logo_url)
                VALUES
                    ($item_id, $user_id, $user_name, $item_name, $rating, $timestamp,
                     $synopsis, $header_synopsis, $genres, $studios, $screenwriters, $cast_json,
                     $tmdb_id, $poster_url, $logo_url);
            ";
            cmd.Parameters.AddWithValue("$item_id", rating.ItemId.ToString());
            cmd.Parameters.AddWithValue("$user_id", rating.UserId.ToString());
            cmd.Parameters.AddWithValue("$user_name", rating.UserName);
            cmd.Parameters.AddWithValue("$item_name", rating.ItemName);
            cmd.Parameters.AddWithValue("$rating", rating.Rating);
            cmd.Parameters.AddWithValue("$timestamp", rating.Timestamp.ToString("o"));
            cmd.Parameters.AddWithValue("$synopsis", (object?)rating.Synopsis ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$header_synopsis", (object?)rating.HeaderSynopsis ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$genres", _serialize(rating.Genres));
            cmd.Parameters.AddWithValue("$studios", _serialize(rating.Studios));
            cmd.Parameters.AddWithValue("$screenwriters", _serialize(rating.Screenwriters));
            cmd.Parameters.AddWithValue("$cast_json", _serialize(rating.Cast));
            cmd.Parameters.AddWithValue("$tmdb_id", (object?)rating.TmdbId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$poster_url", (object?)rating.PosterUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$logo_url", (object?)rating.LogoUrl ?? DBNull.Value);
            cmd.ExecuteNonQuery();
        }

        public UserRating? get_rating(Guid item_id, Guid user_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM ratings WHERE item_id = $item_id AND user_id = $user_id LIMIT 1;";
            cmd.Parameters.AddWithValue("$item_id", item_id.ToString());
            cmd.Parameters.AddWithValue("$user_id", user_id.ToString());
            using var reader = cmd.ExecuteReader();
            return reader.Read() ? _map_row(reader) : null;
        }

        public void delete_rating(Guid item_id, Guid user_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "DELETE FROM ratings WHERE item_id = $item_id AND user_id = $user_id;";
            cmd.Parameters.AddWithValue("$item_id", item_id.ToString());
            cmd.Parameters.AddWithValue("$user_id", user_id.ToString());
            cmd.ExecuteNonQuery();
        }

        public List<UserRating> get_ratings_for_user(Guid user_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM ratings WHERE user_id = $user_id ORDER BY timestamp DESC;";
            cmd.Parameters.AddWithValue("$user_id", user_id.ToString());
            using var reader = cmd.ExecuteReader();
            var list = new List<UserRating>();
            while (reader.Read()) list.Add(_map_row(reader));
            return list;
        }

        private static string _serialize<T>(T value) => JsonSerializer.Serialize(value);

        private static T _deserialize<T>(string? json, T fallback) =>
            string.IsNullOrEmpty(json) ? fallback : (JsonSerializer.Deserialize<T>(json) ?? fallback);

        private static UserRating _map_row(SqliteDataReader r) => new()
        {
            ItemId = Guid.Parse(r.GetString(r.GetOrdinal("item_id"))),
            UserId = Guid.Parse(r.GetString(r.GetOrdinal("user_id"))),
            UserName = r.GetString(r.GetOrdinal("user_name")),
            ItemName = r.GetString(r.GetOrdinal("item_name")),
            Rating = r.GetInt32(r.GetOrdinal("rating")),
            Timestamp = DateTime.Parse(r.GetString(r.GetOrdinal("timestamp"))),
            Synopsis = r.IsDBNull(r.GetOrdinal("synopsis")) ? null : r.GetString(r.GetOrdinal("synopsis")),
            HeaderSynopsis = r.IsDBNull(r.GetOrdinal("header_synopsis")) ? null : r.GetString(r.GetOrdinal("header_synopsis")),
            Genres = _deserialize(r.IsDBNull(r.GetOrdinal("genres")) ? null : r.GetString(r.GetOrdinal("genres")), new List<string>()),
            Studios = _deserialize(r.IsDBNull(r.GetOrdinal("studios")) ? null : r.GetString(r.GetOrdinal("studios")), new List<string>()),
            Screenwriters = _deserialize(r.IsDBNull(r.GetOrdinal("screenwriters")) ? null : r.GetString(r.GetOrdinal("screenwriters")), new List<string>()),
            Cast = _deserialize(r.IsDBNull(r.GetOrdinal("cast_json")) ? null : r.GetString(r.GetOrdinal("cast_json")), new List<Dictionary<string, string>>()),
            TmdbId = r.IsDBNull(r.GetOrdinal("tmdb_id")) ? null : r.GetString(r.GetOrdinal("tmdb_id")),
            PosterUrl = r.IsDBNull(r.GetOrdinal("poster_url")) ? null : r.GetString(r.GetOrdinal("poster_url")),
            LogoUrl = r.IsDBNull(r.GetOrdinal("logo_url")) ? null : r.GetString(r.GetOrdinal("logo_url")),
        };
    }
}
