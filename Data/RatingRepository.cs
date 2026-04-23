using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Jellyfin.Plugin.Rating.Models;
using MediaBrowser.Common.Configuration;

namespace Jellyfin.Plugin.Rating.Data
{
    public class RatingRepository
    {
        private readonly string _data_path;
        private Dictionary<string, UserRating> _ratings = new();
        private readonly object _lock = new();

        public RatingRepository(IApplicationPaths app_paths)
        {
            _data_path = Path.Combine(
                app_paths.PluginConfigurationsPath, "MediaRating", "ratings.json"
            );
            Directory.CreateDirectory(Path.GetDirectoryName(_data_path)!);
            _load();
        }

        private static string _key(Guid item_id, Guid user_id) => $"{item_id}_{user_id}";

        private void _load()
        {
            lock (_lock)
            {
                try
                {
                    if (File.Exists(_data_path))
                    {
                        var json = File.ReadAllText(_data_path);
                        _ratings = JsonSerializer.Deserialize<Dictionary<string, UserRating>>(json) ?? new();
                    }
                }
                catch
                {
                    _ratings = new();
                }
            }
        }

        private void _save()
        {
            lock (_lock)
            {
                var json = JsonSerializer.Serialize(_ratings, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_data_path, json);
            }
        }

        public void save_rating(UserRating rating)
        {
            lock (_lock)
            {
                _ratings[_key(rating.ItemId, rating.UserId)] = rating;
                _save();
            }
        }

        public UserRating? get_rating(Guid item_id, Guid user_id)
        {
            lock (_lock)
            {
                return _ratings.TryGetValue(_key(item_id, user_id), out var r) ? r : null;
            }
        }

        public void delete_rating(Guid item_id, Guid user_id)
        {
            lock (_lock)
            {
                _ratings.Remove(_key(item_id, user_id));
                _save();
            }
        }

        public List<UserRating> get_ratings_for_user(Guid user_id)
        {
            lock (_lock)
            {
                return _ratings.Values
                    .Where(r => r.UserId == user_id)
                    .OrderByDescending(r => r.Timestamp)
                    .ToList();
            }
        }
    }
}
