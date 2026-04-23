using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using Jellyfin.Plugin.Rating.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.Rating
{
    public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
    {
        private readonly ILogger<Plugin> _logger;

        public override string Name => "Media Rating";
        public override Guid Id => Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890");

        public Plugin(
            IApplicationPaths application_paths,
            IXmlSerializer xml_serializer,
            ILogger<Plugin> logger)
            : base(application_paths, xml_serializer)
        {
            Instance = this;
            _logger  = logger;
            _inject_script(application_paths.WebPath);
        }

        public static Plugin? Instance { get; private set; }

        // Injecte le script dans index.html de Jellyfin
        private void _inject_script(string web_path)
        {
            if (string.IsNullOrWhiteSpace(web_path)) return;

            var index_file = Path.Combine(web_path, "index.html");
            if (!File.Exists(index_file)) return;

            var content        = File.ReadAllText(index_file);
            var script_element = "<script plugin=\"MediaRating\" src=\"/web/ConfigurationPage?name=ratings.js\"></script>";

            if (content.Contains(script_element)) return;

            // Supprime l'ancienne version si présente
            content = Regex.Replace(content, "<script plugin=\"MediaRating\".*?</script>", "", RegexOptions.Singleline);

            var closing_body = content.LastIndexOf("</body>");
            if (closing_body == -1) return;

            content = content.Insert(closing_body, script_element);

            try
            {
                File.WriteAllText(index_file, content);
                _logger.LogInformation("[MediaRating] Script injecté dans index.html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[MediaRating] Erreur lors de l'injection dans index.html");
            }
        }

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = this.Name,
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.configPage.html"
                },
                new PluginPageInfo
                {
                    Name = "ratings.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.ratings.js"
                }
            };
        }
    }
}
