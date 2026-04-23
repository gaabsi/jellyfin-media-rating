using System;
using System.Linq;
using System.Net.Mime;
using Jellyfin.Plugin.Rating.Data;
using Jellyfin.Plugin.Rating.Models;
using MediaBrowser.Common.Configuration;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.Rating.Api
{
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

        // POST /api/MediaRating/Rate?itemId=...&userId=...&rating=-1|1|2&userName=...&itemName=...
        [HttpPost("Rate")]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult rate_item(
            [FromQuery] Guid itemId,
            [FromQuery] Guid userId,
            [FromQuery] int rating,
            [FromQuery] string? userName,
            [FromQuery] string? itemName)
        {
            if (!_valid_ratings.Contains(rating))
                return BadRequest(new { success = false, message = "Rating must be -1, 1 or 2" });

            _repository.save_rating(new UserRating
            {
                ItemId    = itemId,
                UserId    = userId,
                UserName  = userName ?? "Unknown",
                ItemName  = itemName ?? "Unknown",
                Rating    = rating,
                Timestamp = DateTime.UtcNow
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

        // GET /api/MediaRating/User/{userId}  — export CSV côté Python
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
                    item_id   = r.ItemId,
                    rating    = r.Rating,
                    timestamp = r.Timestamp
                })
            });
        }
    }
}
