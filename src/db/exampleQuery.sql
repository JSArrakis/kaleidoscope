SELECT DISTINCT m.*
FROM movies m
INNER JOIN media_tags mt ON m.mediaItemId = mt.mediaItemId
INNER JOIN tags t ON mt.tagId = t.tagId AND mt.tagType = 'tag'
WHERE t.name IN ('toonami', 'action', 'anime')
  AND m.durationLimit = 1800
GROUP BY m.id
HAVING COUNT(DISTINCT t.name) >= 2  -- Must have at least 2 of the specified tags
ORDER BY m.title;