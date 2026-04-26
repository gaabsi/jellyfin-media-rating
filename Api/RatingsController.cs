using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mime;
using Jellyfin.Plugin.Rating.Data;
using Jellyfin.Plugin.Rating.Models;
using MediaBrowser.Common.Configuration;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.Rating.Api
{
    public class RateRequest
    {
        public Guid ItemId { get; set; }
        public Guid UserId { get; set; }
        public int Rating { get; set; }
        public string? UserName { get; set; }
        public string? ItemName { get; set; }
        public string? Synopsis { get; set; }
        public string? HeaderSynopsis { get; set; }
        public List<string>? Genres { get; set; }
        public List<string>? Studios { get; set; }
        public List<string>? Screenwriters { get; set; }
        public List<Dictionary<string, string>>? Cast { get; set; }
        public string? TmdbId { get; set; }
        public string? PosterUrl { get; set; }
        public string? LogoUrl { get; set; }
    }

    [ApiController]
    [Route("api/MediaRating")]
    public class RatingsController : ControllerBase
    {
        private readonly RatingRepository _repository;

        private static readonly int[] _valid_ratings = { -1, 1, 2 };

        public RatingsController(IApplicationPaths app_paths)
        {
            _repository = new RatingRepository(app_paths);
        }

        // POST /api/MediaRating/Rate  (body JSON)
        [HttpPost("Rate")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult rate_item([FromBody] RateRequest req)
        {
            if (!_valid_ratings.Contains(req.Rating))
                return BadRequest(new { success = false, message = "Rating must be -1, 1 or 2" });

            _repository.save_rating(new UserRating
            {
                ItemId         = req.ItemId,
                UserId         = req.UserId,
                UserName       = req.UserName ?? "Unknown",
                ItemName       = req.ItemName ?? "Unknown",
                Rating         = req.Rating,
                Timestamp      = DateTime.UtcNow,
                Synopsis       = req.Synopsis,
                HeaderSynopsis = req.HeaderSynopsis,
                Genres         = req.Genres ?? new(),
                Studios        = req.Studios ?? new(),
                Screenwriters  = req.Screenwriters ?? new(),
                Cast           = req.Cast ?? new(),
                TmdbId         = req.TmdbId,
                PosterUrl      = req.PosterUrl,
                LogoUrl        = req.LogoUrl
            });

            return Ok(new { success = true });
        }

        // GET /api/MediaRating/MyRating/{itemId}?userId=...
        [HttpGet("MyRating/{itemId}")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult get_my_rating(Guid itemId, [FromQuery] Guid userId)
        {
            var r = _repository.get_rating(itemId, userId);
            return Ok(new { success = true, rating = r?.Rating });
        }

        // DELETE /api/MediaRating/Rating?itemId=...&userId=...
        [HttpDelete("Rating")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult delete_rating([FromQuery] Guid itemId, [FromQuery] Guid userId)
        {
            _repository.delete_rating(itemId, userId);
            return Ok(new { success = true });
        }

        // GET /api/MediaRating/User/{userId}
        [HttpGet("User/{userId}")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult get_user_ratings(Guid userId)
        {
            var ratings = _repository.get_ratings_for_user(userId);
            return Ok(new
            {
                success = true,
                ratings = ratings.Select(r => new
                {
                    item_id         = r.ItemId,
                    item_name       = r.ItemName,
                    rating          = r.Rating,
                    timestamp       = r.Timestamp,
                    synopsis        = r.Synopsis,
                    header_synopsis = r.HeaderSynopsis,
                    genres          = r.Genres,
                    studios         = r.Studios,
                    screenwriters   = r.Screenwriters,
                    cast            = r.Cast,
                    tmdb_id         = r.TmdbId,
                    poster_url      = r.PosterUrl,
                    logo_url        = r.LogoUrl
                })
            });
        }
    }
}
