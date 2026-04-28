using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.Rating.Configuration
{
    public class PluginConfiguration : BasePluginConfiguration
    {
        public string SeerrUrl { get; set; } = "";
        public string SeerrApiKey { get; set; } = "";
        public string TmdbApiKey { get; set; } = "";
    }
}
