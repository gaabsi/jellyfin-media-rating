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

        private const string EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

        private void _init_schema()
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();

            if (!_table_exists(con, "ratings"))
            {
                _create_fresh_schema(con);
                return;
            }

            if (!_column_exists(con, "ratings", "in_library"))
                _migrate_v1_to_v2(con);

            if (!_column_exists(con, "ratings", "media_type"))
                _add_media_type_column(con);
        }

        private static void _add_media_type_column(SqliteConnection con)
        {
            using var cmd = con.CreateCommand();
            cmd.CommandText = "ALTER TABLE ratings ADD COLUMN media_type TEXT;";
            cmd.ExecuteNonQuery();
        }

        private static bool _table_exists(SqliteConnection con, string name)
        {
            using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT 1 FROM sqlite_master WHERE type='table' AND name=$n LIMIT 1;";
            cmd.Parameters.AddWithValue("$n", name);
            return cmd.ExecuteScalar() != null;
        }

        private static bool _column_exists(SqliteConnection con, string table, string column)
        {
            using var cmd = con.CreateCommand();
            cmd.CommandText = $"PRAGMA table_info({table});";
            using var r = cmd.ExecuteReader();
            while (r.Read()) if (r.GetString(1) == column) return true;
            return false;
        }

        private static void _create_fresh_schema(SqliteConnection con)
        {
            using var cmd = con.CreateCommand();
            cmd.CommandText = $@"
                CREATE TABLE ratings (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
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
                    in_library       INTEGER NOT NULL DEFAULT 1,
                    media_type       TEXT
                );
                CREATE INDEX idx_user ON ratings(user_id);
                CREATE INDEX idx_tmdb ON ratings(tmdb_id);
                CREATE UNIQUE INDEX uq_native ON ratings(item_id, user_id) WHERE item_id != '{EMPTY_GUID}';
                CREATE UNIQUE INDEX uq_orphan ON ratings(tmdb_id, user_id) WHERE item_id = '{EMPTY_GUID}';
            ";
            cmd.ExecuteNonQuery();
        }

        private static void _migrate_v1_to_v2(SqliteConnection con)
        {
            using var tx = con.BeginTransaction();
            using var cmd = con.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = $@"
                ALTER TABLE ratings RENAME TO ratings_old;

                CREATE TABLE ratings (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
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
                    in_library       INTEGER NOT NULL DEFAULT 1,
                    media_type       TEXT
                );

                INSERT INTO ratings
                    (item_id, user_id, user_name, item_name, rating, timestamp,
                     synopsis, header_synopsis, genres, studios, screenwriters, cast_json,
                     tmdb_id, poster_url, logo_url, in_library)
                SELECT
                     item_id, user_id, user_name, item_name, rating, timestamp,
                     synopsis, header_synopsis, genres, studios, screenwriters, cast_json,
                     tmdb_id, poster_url, logo_url, 1
                FROM ratings_old;

                DROP TABLE ratings_old;

                CREATE INDEX idx_user ON ratings(user_id);
                CREATE INDEX idx_tmdb ON ratings(tmdb_id);
                CREATE UNIQUE INDEX uq_native ON ratings(item_id, user_id) WHERE item_id != '{EMPTY_GUID}';
                CREATE UNIQUE INDEX uq_orphan ON ratings(tmdb_id, user_id) WHERE item_id = '{EMPTY_GUID}';
            ";
            cmd.ExecuteNonQuery();
            tx.Commit();
        }

        public void save_rating(UserRating rating)
        {
            var is_orphan = rating.ItemId == Guid.Empty;
            var conflict_clause = is_orphan
                ? $"ON CONFLICT(tmdb_id, user_id) WHERE item_id = '{EMPTY_GUID}'"
                : $"ON CONFLICT(item_id, user_id) WHERE item_id != '{EMPTY_GUID}'";

            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = $@"
                INSERT INTO ratings
                    (item_id, user_id, user_name, item_name, rating, timestamp,
                     synopsis, header_synopsis, genres, studios, screenwriters, cast_json,
                     tmdb_id, poster_url, logo_url, in_library, media_type)
                VALUES
                    ($item_id, $user_id, $user_name, $item_name, $rating, $timestamp,
                     $synopsis, $header_synopsis, $genres, $studios, $screenwriters, $cast_json,
                     $tmdb_id, $poster_url, $logo_url, $in_library, $media_type)
                {conflict_clause} DO UPDATE SET
                    user_name = excluded.user_name,
                    item_name = excluded.item_name,
                    rating = excluded.rating,
                    timestamp = excluded.timestamp,
                    synopsis = excluded.synopsis,
                    header_synopsis = excluded.header_synopsis,
                    genres = excluded.genres,
                    studios = excluded.studios,
                    screenwriters = excluded.screenwriters,
                    cast_json = excluded.cast_json,
                    tmdb_id = excluded.tmdb_id,
                    poster_url = excluded.poster_url,
                    logo_url = excluded.logo_url,
                    in_library = excluded.in_library,
                    media_type = excluded.media_type;
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
            cmd.Parameters.AddWithValue("$in_library", rating.InLibrary ? 1 : 0);
            cmd.Parameters.AddWithValue("$media_type", (object?)rating.MediaType ?? DBNull.Value);
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

        public UserRating? get_rating_by_tmdb(string tmdb_id, Guid user_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = $"SELECT * FROM ratings WHERE item_id = '{EMPTY_GUID}' AND tmdb_id = $tmdb_id AND user_id = $user_id LIMIT 1;";
            cmd.Parameters.AddWithValue("$tmdb_id", tmdb_id);
            cmd.Parameters.AddWithValue("$user_id", user_id.ToString());
            using var reader = cmd.ExecuteReader();
            return reader.Read() ? _map_row(reader) : null;
        }

        public void migrate_to_item_id(string tmdb_id, Guid user_id, Guid new_item_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var tx = con.BeginTransaction();

            using (var del = con.CreateCommand())
            {
                del.Transaction = tx;
                del.CommandText = "DELETE FROM ratings WHERE item_id = $item_id AND user_id = $user_id;";
                del.Parameters.AddWithValue("$item_id", new_item_id.ToString());
                del.Parameters.AddWithValue("$user_id", user_id.ToString());
                del.ExecuteNonQuery();
            }

            using (var upd = con.CreateCommand())
            {
                upd.Transaction = tx;
                upd.CommandText = $@"
                    UPDATE ratings
                    SET item_id = $new_item_id, in_library = 1
                    WHERE item_id = '{EMPTY_GUID}' AND tmdb_id = $tmdb_id AND user_id = $user_id;
                ";
                upd.Parameters.AddWithValue("$new_item_id", new_item_id.ToString());
                upd.Parameters.AddWithValue("$tmdb_id", tmdb_id);
                upd.Parameters.AddWithValue("$user_id", user_id.ToString());
                upd.ExecuteNonQuery();
            }

            tx.Commit();
        }

        public void delete_orphan_by_tmdb(string tmdb_id, Guid user_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = $"DELETE FROM ratings WHERE item_id = '{EMPTY_GUID}' AND tmdb_id = $tmdb_id AND user_id = $user_id;";
            cmd.Parameters.AddWithValue("$tmdb_id", tmdb_id);
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
            InLibrary = r.GetInt32(r.GetOrdinal("in_library")) != 0,
            MediaType = r.IsDBNull(r.GetOrdinal("media_type")) ? null : r.GetString(r.GetOrdinal("media_type")),
        };
    }
}
