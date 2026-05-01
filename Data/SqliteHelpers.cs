using Microsoft.Data.Sqlite;

namespace Jellyfin.Plugin.Rating.Data
{
    public static class SqliteHelpers
    {
        public static bool table_exists(SqliteConnection con, string name)
        {
            using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT 1 FROM sqlite_master WHERE type='table' AND name=$n LIMIT 1;";
            cmd.Parameters.AddWithValue("$n", name);
            return cmd.ExecuteScalar() != null;
        }

        public static bool column_exists(SqliteConnection con, string table, string column)
        {
            using var cmd = con.CreateCommand();
            cmd.CommandText = $"PRAGMA table_info({table});";
            using var r = cmd.ExecuteReader();
            while (r.Read()) if (r.GetString(1) == column) return true;
            return false;
        }
    }
}
