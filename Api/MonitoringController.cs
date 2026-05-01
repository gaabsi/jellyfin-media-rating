using System;
using System.Net.Http;
using System.Net.Mime;
using System.Threading.Tasks;
using Jellyfin.Plugin.Rating.Data;
using Jellyfin.Plugin.Rating.Services;
using MediaBrowser.Common.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.Rating.Api
{
    public class StartMonitoringRequest
    {
        public string UserId { get; set; } = "";
        public string TmdbId { get; set; } = "";
        public string MediaType { get; set; } = "";
    }

    [ApiController]
    [Route("api/MediaRating/Monitoring")]
    public class MonitoringController : ControllerBase
    {
        private readonly MonitoringService _service;

        public MonitoringController(
            IApplicationPaths app_paths,
            IHttpClientFactory http_factory,
            ILoggerFactory logger_factory)
        {
            var repo = new MonitoringRepository(app_paths);
            var tmdb = new TmdbClient(http_factory, logger_factory.CreateLogger<TmdbClient>());
            _service = new MonitoringService(repo, tmdb, logger_factory.CreateLogger<MonitoringService>());
        }

        // POST /api/MediaRating/Monitoring
        [HttpPost]
        [Produces(MediaTypeNames.Application.Json)]
        public async Task<ActionResult> start([FromBody] StartMonitoringRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.UserId) || string.IsNullOrWhiteSpace(req.TmdbId))
                return BadRequest(new { success = false, message = "UserId et TmdbId requis" });

            if (req.MediaType != "movie" && req.MediaType != "series")
                return BadRequest(new { success = false, message = "MediaType doit être 'movie' ou 'series'" });

            var id = await _service.start_monitoring(req.UserId, req.TmdbId, req.MediaType);
            if (id == null)
                return Ok(new { success = false, message = "Échec — TMDB introuvable ou clé API manquante" });

            return Ok(new { success = true, monitoringId = id });
        }

        // DELETE /api/MediaRating/Monitoring/{id}?userId=...
        [HttpDelete("{id:long}")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult stop(long id, [FromQuery] string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest(new { success = false, message = "userId requis" });

            var ok = _service.stop_monitoring(id, userId);
            return Ok(new { success = ok });
        }

        // GET /api/MediaRating/Monitoring?userId=...
        [HttpGet]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult list([FromQuery] string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest(new { success = false, message = "userId requis" });

            var data = _service.list_for_user(userId);
            return Ok(new { success = true, data });
        }

        // POST /api/MediaRating/Monitoring/{id}/refresh
        [HttpPost("{id:long}/refresh")]
        [Produces(MediaTypeNames.Application.Json)]
        public async Task<ActionResult> refresh(long id)
        {
            var ok = await _service.refresh_one(id);
            return Ok(new { success = ok });
        }
    }
}
