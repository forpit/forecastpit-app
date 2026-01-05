DROP VIEW IF EXISTS games_with_growth;

CREATE OR REPLACE VIEW games_with_growth AS
WITH latest_snapshot AS (
  SELECT DISTINCT ON (game_id)
    game_id,
    total_plays as plays_24h_ago,
    snapshot_date
  FROM game_play_snapshots
  WHERE snapshot_date >= CURRENT_DATE - INTERVAL '2 days'
    AND snapshot_date < CURRENT_DATE
  ORDER BY game_id, snapshot_date DESC
),
week_snapshot AS (
  SELECT DISTINCT ON (game_id)
    game_id,
    total_plays as plays_7d_ago,
    snapshot_date,
    CURRENT_DATE - snapshot_date as days_ago
  FROM game_play_snapshots
  WHERE snapshot_date < CURRENT_DATE - INTERVAL '4 days'
  ORDER BY game_id, snapshot_date DESC
)
SELECT
  g.*,
  g.total_plays as current_plays,
  COALESCE(g.total_plays - ls.plays_24h_ago, 0) as growth_24h,
  CASE
    WHEN ls.plays_24h_ago > 0 THEN
      ROUND(((g.total_plays - ls.plays_24h_ago)::numeric / ls.plays_24h_ago::numeric * 100), 1)
    ELSE 0
  END as growth_24h_percent,
  COALESCE(g.total_plays - ws.plays_7d_ago, 0) as growth_7d,
  CASE
    WHEN ws.plays_7d_ago > 0 THEN
      ROUND(((g.total_plays - ws.plays_7d_ago)::numeric / ws.plays_7d_ago::numeric * 100), 1)
    ELSE 0
  END as growth_7d_percent
FROM games g
LEFT JOIN latest_snapshot ls ON g.id = ls.game_id
LEFT JOIN week_snapshot ws ON g.id = ws.game_id;
