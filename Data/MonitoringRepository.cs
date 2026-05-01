using System;
using System.Collections.Generic;
using System.IO;
using Jellyfin.Plugin.Rating.Models;
using MediaBrowser.Common.Configuration;
using Microsoft.Data.Sqlite;

namespace Jellyfin.Plugin.Rating.Data
{
    public class MonitoringRepository
    {
        private readonly string _db_path;
        private readonly string _connection_string;

        public MonitoringRepository(IApplicationPaths app_paths)
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

            if (!SqliteHelpers.table_exists(con, "monitoring"))
                _create_monitoring_table(con);

            if (!SqliteHelpers.table_exists(con, "monitoring_releases"))
                _create_releases_table(con);
        }

        private static void _create_monitoring_table(SqliteConnection con)
        {
            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                CREATE TABLE monitoring (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id         TEXT NOT NULL,
                    media_type      TEXT NOT NULL,
                    tmdb_id         TEXT NOT NULL,
                    collection_id   TEXT,
                    label           TEXT NOT NULL,
                    created_at      TEXT NOT NULL,
                    last_checked_at TEXT
                );
                CREATE UNIQUE INDEX uq_monitor ON monitoring(user_id, media_type, tmdb_id);
            ";
            cmd.ExecuteNonQuery();
        }

        private static void _create_releases_table(SqliteConnection con)
        {
            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                CREATE TABLE monitoring_releases (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    monitoring_id   INTEGER NOT NULL,
                    tmdb_id         TEXT NOT NULL,
                    title           TEXT NOT NULL,
                    release_date    TEXT,
                    seen_at         TEXT NOT NULL,
                    FOREIGN KEY(monitoring_id) REFERENCES monitoring(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_releases_monitoring ON monitoring_releases(monitoring_id);
                CREATE UNIQUE INDEX uq_release ON monitoring_releases(monitoring_id, tmdb_id);
            ";
            cmd.ExecuteNonQuery();
        }

        public long insert_monitoring(MonitoringRow row)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO monitoring (user_id, media_type, tmdb_id, collection_id, label, created_at, last_checked_at)
                VALUES ($user_id, $media_type, $tmdb_id, $collection_id, $label, $created_at, $last_checked_at)
                ON CONFLICT(user_id, media_type, tmdb_id) DO UPDATE SET
                    collection_id = excluded.collection_id,
                    label = excluded.label
                RETURNING id;
            ";
            cmd.Parameters.AddWithValue("$user_id", row.UserId);
            cmd.Parameters.AddWithValue("$media_type", row.MediaType);
            cmd.Parameters.AddWithValue("$tmdb_id", row.TmdbId);
            cmd.Parameters.AddWithValue("$collection_id", (object?)row.CollectionId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$label", row.Label);
            cmd.Parameters.AddWithValue("$created_at", row.CreatedAt.ToString("o"));
            cmd.Parameters.AddWithValue("$last_checked_at", row.LastCheckedAt.HasValue ? row.LastCheckedAt.Value.ToString("o") : (object)DBNull.Value);
            var result = cmd.ExecuteScalar();
            return Convert.ToInt64(result);
        }

        public bool delete_monitoring(long monitoring_id, string user_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "DELETE FROM monitoring WHERE id = $id AND user_id = $user_id;";
            cmd.Parameters.AddWithValue("$id", monitoring_id);
            cmd.Parameters.AddWithValue("$user_id", user_id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public MonitoringRow? get_monitoring(long monitoring_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM monitoring WHERE id = $id LIMIT 1;";
            cmd.Parameters.AddWithValue("$id", monitoring_id);
            using var reader = cmd.ExecuteReader();
            return reader.Read() ? _map_monitoring(reader) : null;
        }

        public List<MonitoringRow> list_monitoring_for_user(string user_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM monitoring WHERE user_id = $user_id ORDER BY created_at DESC;";
            cmd.Parameters.AddWithValue("$user_id", user_id);
            using var reader = cmd.ExecuteReader();
            var list = new List<MonitoringRow>();
            while (reader.Read()) list.Add(_map_monitoring(reader));
            return list;
        }

        public List<MonitoringRow> list_all_monitoring()
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM monitoring;";
            using var reader = cmd.ExecuteReader();
            var list = new List<MonitoringRow>();
            while (reader.Read()) list.Add(_map_monitoring(reader));
            return list;
        }

        public void touch_last_checked(long monitoring_id, DateTime when)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE monitoring SET last_checked_at = $when WHERE id = $id;";
            cmd.Parameters.AddWithValue("$id", monitoring_id);
            cmd.Parameters.AddWithValue("$when", when.ToString("o"));
            cmd.ExecuteNonQuery();
        }

        public void upsert_releases(long monitoring_id, IEnumerable<ReleaseRow> releases)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var tx = con.BeginTransaction();
            using var cmd = con.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = @"
                INSERT INTO monitoring_releases (monitoring_id, tmdb_id, title, release_date, seen_at)
                VALUES ($monitoring_id, $tmdb_id, $title, $release_date, $seen_at)
                ON CONFLICT(monitoring_id, tmdb_id) DO UPDATE SET
                    title = excluded.title,
                    release_date = excluded.release_date;
            ";
            var p_monitoring = cmd.Parameters.Add("$monitoring_id", SqliteType.Integer);
            var p_tmdb = cmd.Parameters.Add("$tmdb_id", SqliteType.Text);
            var p_title = cmd.Parameters.Add("$title", SqliteType.Text);
            var p_release = cmd.Parameters.Add("$release_date", SqliteType.Text);
            var p_seen = cmd.Parameters.Add("$seen_at", SqliteType.Text);

            foreach (var r in releases)
            {
                p_monitoring.Value = monitoring_id;
                p_tmdb.Value = r.TmdbId;
                p_title.Value = r.Title;
                p_release.Value = (object?)r.ReleaseDate ?? DBNull.Value;
                p_seen.Value = r.SeenAt.ToString("o");
                cmd.ExecuteNonQuery();
            }
            tx.Commit();
        }

        public List<ReleaseRow> list_releases(long monitoring_id)
        {
            using var con = new SqliteConnection(_connection_string);
            con.Open();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM monitoring_releases WHERE monitoring_id = $id ORDER BY release_date IS NULL, release_date ASC;";
            cmd.Parameters.AddWithValue("$id", monitoring_id);
            using var reader = cmd.ExecuteReader();
            var list = new List<ReleaseRow>();
            while (reader.Read()) list.Add(_map_release(reader));
            return list;
        }

        private static MonitoringRow _map_monitoring(SqliteDataReader r) => new()
        {
            Id = r.GetInt64(r.GetOrdinal("id")),
            UserId = r.GetString(r.GetOrdinal("user_id")),
            MediaType = r.GetString(r.GetOrdinal("media_type")),
            TmdbId = r.GetString(r.GetOrdinal("tmdb_id")),
            CollectionId = r.IsDBNull(r.GetOrdinal("collection_id")) ? null : r.GetString(r.GetOrdinal("collection_id")),
            Label = r.GetString(r.GetOrdinal("label")),
            CreatedAt = DateTime.Parse(r.GetString(r.GetOrdinal("created_at"))),
            LastCheckedAt = r.IsDBNull(r.GetOrdinal("last_checked_at")) ? null : DateTime.Parse(r.GetString(r.GetOrdinal("last_checked_at"))),
        };

        private static ReleaseRow _map_release(SqliteDataReader r) => new()
        {
            Id = r.GetInt64(r.GetOrdinal("id")),
            MonitoringId = r.GetInt64(r.GetOrdinal("monitoring_id")),
            TmdbId = r.GetString(r.GetOrdinal("tmdb_id")),
            Title = r.GetString(r.GetOrdinal("title")),
            ReleaseDate = r.IsDBNull(r.GetOrdinal("release_date")) ? null : r.GetString(r.GetOrdinal("release_date")),
            SeenAt = DateTime.Parse(r.GetString(r.GetOrdinal("seen_at"))),
        };
    }
}
