# Refract Prism

The refract prism is the core intelligence engine for selecting the next piece of media content based on facets (genre + aesthetic combinations) and their relationships.

## Overview

The refract prism uses a "controlled chaos" approach to media selection, avoiding both:
- Always picking the closest/most similar content (boring)
- Picking content that's too distant/incompatible (jarring)

## Key Features

### 1. Controlled Chaos Selection
- Uses weighted random selection within distance constraints
- Favors closer relationships but allows randomness
- Configurable distance ranges (minDistance to maxDistance)
- Default range: 0.05 to 0.7 (on 0.0-1.0 scale where 0.0 is perfect compatibility)

### 2. Duration Awareness
- Respects maximum duration constraints for both movies and shows
- For shows: Checks if next episode exceeds duration limits using progression system
- Filters out content that would exceed time constraints

### 3. Recent Media Tracking
- Integrates with RecentlyUsedMedia system to avoid repetition
- Configurable expiration times based on usage context
- Prevents back-to-back identical content

### 4. Show vs Movie Preference
- Implements coin flip selection between shows and movies
- Configurable bias toward shows or movies
- Intelligent fallback when preferred type unavailable

### 5. Facet Walking
- Starts from source media's facets (genre + aesthetic combinations)
- "Walks" to a target facet using relationship distances
- Gathers candidate media from the TARGET facet (not source)

## Usage

```typescript
import { refractFromMedia, RefractOptions } from './prisms/refract';

const options: RefractOptions = {
  maxDistance: 0.6,           // Don't walk too far
  minDistance: 0.1,           // Avoid too-similar content
  preferShowsOverMovies: true, // Bias toward shows
  maxDurationMinutes: 120,    // 2-hour limit
  usageContext: 'main_content',
  streamSessionId: 'session-123'
};

const result = await refractFromMedia(currentMedia, options);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxDistance` | number | 0.7 | Maximum relationship distance to consider |
| `minDistance` | number | 0.05 | Minimum distance for controlled chaos |
| `preferShowsOverMovies` | boolean | undefined | Bias selection (undefined = 50/50 coin flip) |
| `maxDurationMinutes` | number | undefined | Maximum content duration |
| `usageContext` | string | 'main_content' | Context for recent media tracking |
| `streamSessionId` | string | undefined | Session ID for usage tracking |

## Return Value

```typescript
interface RefractResult {
  sourceFacetId?: string;           // Starting facet ID
  chosenRelationship?: {            // Chosen relationship to walk
    targetFacetId: string;
    distance: number;
  } | null;
  selectedMedia?: BaseMedia | null;  // Final selected media
  selectionReason?: string;         // Why this media was chosen
}
```

## Algorithm Flow

1. **Extract Tags**: Get genre/aesthetic tags from source media
2. **Find Source Facets**: Locate facets matching source media tags
3. **Pick Source Facet**: Random selection from matching facets
4. **Controlled Chaos Walk**: Select target facet using weighted distance algorithm
5. **Gather Candidates**: Find movies/shows matching target facet
6. **Filter Candidates**: Apply duration and recent usage constraints
7. **Coin Flip Selection**: Choose between movies and shows based on preference
8. **Record Usage**: Track selection to prevent immediate repetition
9. **Return Result**: Provide selected media with selection reasoning

## Examples

### Basic Usage
```typescript
// Simple refract for any duration
const result = await refractFromMedia(currentMovie);
```

### Time-Constrained Selection
```typescript
// Select content under 90 minutes, prefer shows
const result = await refractFromMedia(currentMovie, {
  maxDurationMinutes: 90,
  preferShowsOverMovies: true
});
```

### Conservative Selection (Closer Relationships)
```typescript
// Stay closer to current content style
const result = await refractFromMedia(currentMovie, {
  maxDistance: 0.4,
  minDistance: 0.05
});
```

### Adventurous Selection (Wider Range)
```typescript
// Allow more variety in content selection
const result = await refractFromMedia(currentMovie, {
  maxDistance: 0.8,
  minDistance: 0.2
});
```

## Integration with Other Systems

- **Progression Manager**: Checks episode availability and duration limits
- **Recently Used Media**: Prevents repetitive content selection
- **Facet Repository**: Accesses facet relationships and distance matrix
- **Movie/Show Repositories**: Sources candidate media content

## Logging and Debugging

The refract prism logs detailed selection information including:
- Source and target facets
- Relationship distance walked
- Candidate counts by type
- Selection reasoning
- Duration and usage constraints applied

This information is valuable for understanding and tuning the selection behavior.
