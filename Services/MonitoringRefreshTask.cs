using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin.Plugin.Rating.Data;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Tasks;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.Rating.Services
{
    public class MonitoringRefreshTask : IScheduledTask
    {
        private readonly IApplicationPaths _app_paths;
        private readonly IHttpClientFactory _http_factory;
        private readonly ILoggerFactory _logger_factory;
        private readonly ILogger<MonitoringRefreshTask> _logger;

        public MonitoringRefreshTask(
            IApplicationPaths app_paths,
            IHttpClientFactory http_factory,
            ILoggerFactory logger_factory)
        {
            _app_paths = app_paths;
            _http_factory = http_factory;
            _logger_factory = logger_factory;
            _logger = logger_factory.CreateLogger<MonitoringRefreshTask>();
        }

        public string Name => "Media Rating — Refresh monitoring";
        public string Description => "Met à jour les sorties suivies (films/saga, séries) depuis TMDB.";
        public string Category => "Media Rating";
        public string Key => "MediaRatingMonitoringRefresh";

        public async Task ExecuteAsync(IProgress<double> progress, CancellationToken ct)
        {
            var repo = new MonitoringRepository(_app_paths);
            var tmdb = new TmdbClient(_http_factory, _logger_factory.CreateLogger<TmdbClient>());
            var service = new MonitoringService(repo, tmdb, _logger_factory.CreateLogger<MonitoringService>());

            _logger.LogInformation("[Monitoring] Refresh task start");
            progress.Report(0);
            await service.refresh_all();
            progress.Report(100);
            _logger.LogInformation("[Monitoring] Refresh task done");
        }

        public IEnumerable<TaskTriggerInfo> GetDefaultTriggers() => new[]
        {
            new TaskTriggerInfo
            {
                Type = TaskTriggerInfo.TriggerDaily,
                TimeOfDayTicks = TimeSpan.FromHours(4).Ticks
            }
        };
    }
}
