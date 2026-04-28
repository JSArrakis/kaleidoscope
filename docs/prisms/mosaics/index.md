[HOME](../index.md)

# Mosaic

## The Challenge

When building Kaleidoscope's buffer system to select commercials, shorts, and other filler media between shows and movies, I faced a fundamental question: how do we incorporate music videos and audio content in a way that doesn't break the thematic coherence of the stream?

The first five taxonomies I created (Genre, Aesthetic, Era, Age Group, Specialty, Holiday) all describe the visual media's narrative and aesthetic properties. They tell us what a movie _is_ and what it _feels_ like. But music exists in a different dimension. A song doesn't have a narrative genre or an aesthetic presentation in the same way, it only has a musical genre which needs to thematically relate to the narrative facet that preceded it or will follow it.

A Synthwave track should play before or after something that _feels_ like Synthwave — something dark, urban, technological, melancholic. Not after a bright fantasy adventure. Similarly, some orchestral music belongs in epic, heroic contexts. Jazz belongs in noir and introspection. Folk belongs in grounded, historical, or whimsical spaces.

## The Solution: Mosaic

Mosaic solves this by establishing **connections between narrative facets and musical genres**. These connections are implicit as they describe coherence through inherent linkage rather than through explicit emotional labeling.

The insight is simple: **the facet itself already contains all the meaning we need.** A facet like "Action + Cyberpunk" is so specific in its thematic intent that it directly implies what music should accompany it. The curator of the stream simply needs to map facets to the musical genres that express them in what ever ways speak to them.

## How Mosaic Works

A Mosaic is a record that links a single [Facet](../facets/index.md) to one or more [Musical Genre](../../taxonomies/musicalGenres/index.md) tags. Since a Facet is already a genre + aesthetic pairing with a distinct thematic identity, the Mosaic simply answers the question: _"What music sounds like this identity?"_

### The Data Model

```
Mosaic
  ├── mosaicId          unique identifier
  ├── facetId           FK → Facet (a genre + aesthetic pairing)
  ├── musicalGenres[]   tagIds of MusicalGenre tags
  ├── name              optional display label
  └── description       optional curator notes
```

Each Facet can have one Mosaic. The `musicalGenres` array stores the tagIds of MusicalGenre tags — not genre name strings — so the link is always to the canonical tag definition in the database.

### Example Mappings

| Facet (Genre + Aesthetic) | Musical Genres                      | Why                                                |
| ------------------------- | ----------------------------------- | -------------------------------------------------- |
| Thriller + Cyberpunk      | Synthwave, Darkwave, Industrial     | Cold, mechanical tension with electronic textures  |
| Thriller + Noir           | Jazz, Bebop, Blues                  | Smoky, introspective, morally ambiguous atmosphere |
| Adventure + Fantasy       | Orchestral, Celtic, Folk            | Sweeping, mythic, pastoral landscapes              |
| Horror + Gothic           | Doom Metal, Dark Ambient, Classical | Heavy, oppressive, grandiose dread                 |
| Comedy + Contemporary     | Pop, Indie Rock, Funk               | Light, upbeat, modern energy                       |
| Drama + Period            | Classical, Chamber, Baroque         | Formal, refined, historically grounded             |
| Action + Space Opera      | Power Metal, Orchestral, Synthwave  | Epic, bombastic, larger-than-life scale            |

These mappings are curator-defined. There is no algorithm deciding which musical genres belong to which facet — the user configures them based on their own sensibility and library. This is intentional: the relationship between visual identity and musical identity is inherently subjective, and Kaleidoscope respects the user's idiom.

## Three Music Selection Paths

Mosaic is one of three paths through which the [Spectrum](../spectrum.md) buffer media selector finds music. Each operates at a different gate in the gated pool expansion system (see [BackendArchitecture §7.2](../../BackendArchitecture.md#72-spectrum-prismsspectrumt)).

### Path 1: Specialty Tags (Gate 2)

If the anchor media has Specialty tags (e.g. "Toonami", "Criterion Collection"), the system looks for music tagged with those same Specialty tags. This is the most direct and specific match — the curator has explicitly said "this music belongs with this specialty group."

To prevent repetitive selection when the specialty music pool is small (e.g. only 3-4 tracks tagged "Nickelodeon"), this path uses a **50% coin-flip**. Half the time, specialty music is skipped entirely, letting later gates contribute music instead. This ensures variety across multiple consecutive buffers during a specialty-heavy stretch of the stream.

### Path 2: Direct Musical Genre Tags (Gate 3, Priority 1)

Some anchor media may have MusicalGenre tags placed directly on them. For example, a show set in a jazz club might carry a "Jazz" MusicalGenre tag. When these exist, the system queries for music matching those exact tagIds.

Direct tags always take priority over Mosaic resolution. They represent an explicit curator decision about what music belongs with this specific piece of media, overriding the broader facet-level mapping.

### Path 3: Mosaic Resolution (Gate 3, Priority 2)

When anchor media has no direct MusicalGenre tags — which is the common case — Mosaic provides the fallback. The resolution chain works as follows:

1. **Segment the anchor's tags** into genre and aesthetic categories
2. **Find matching Facets** for each genre × aesthetic pairing (same as the facet system uses for anchor media walking)
3. **Look up Mosaics** for each matched facet via `mosaicRepository.findByFacetId()`
4. **Collect all musical genre tagIds** from the resolved Mosaics (deduplicated)
5. **Query music** tagged with any of those tagIds

This means the music in a buffer is thematically connected to the visual media surrounding it, even though the two share no tags in common. The Facet acts as the bridge — its genre + aesthetic identity implies a musical palette, and the Mosaic encodes that implication.

### What Happens When No Path Finds Music

If none of the three paths produce music (no specialty tags, no direct musical genre tags, no matching facets or mosaics), the music array for that gate is simply empty. The buffer constructor will still fill the gap with commercials and shorts. Music is always optional in a buffer — its absence doesn't break anything; its presence enhances the thematic texture.

Later gates (Age Group, Untagged, Random) may also contribute music through their own selection logic, independent of Mosaic.

## Where Mosaic Sits in the System

Mosaic is the third component of the [Prism System](../index.md), alongside Facets and Spectrum:

- **Facets** handle anchor-to-anchor transitions (walking the stream through thematically related movies and shows)
- **Spectrum** handles buffer media pool selection (finding commercials, shorts, and music for the gaps)
- **Mosaic** provides the bridge between the visual taxonomy (genre, aesthetic) and the musical taxonomy (musical genres) within Spectrum's Gate 3

Mosaic does not participate in anchor media selection, holiday logic, or any other part of the stream construction pipeline. It exists solely to answer one question: _"Given the thematic identity of what's playing, what music should accompany it?"_

## Curator Guidance

When populating Mosaics, consider:

- **Start broad, refine later.** An initial mapping of 2-3 musical genres per facet is enough to get meaningful results. You can always expand or narrow the palette as you hear how the stream sounds.
- **Think in textures, not lyrics.** The goal is tonal alignment, not narrative matching. A Synthwave track doesn't need to be _about_ cyberpunk — it just needs to _feel_ like it belongs in that space.
- **Overlap is fine.** Multiple facets can share the same musical genres. Jazz might appear in both Thriller + Noir and Drama + Period. The system deduplicates at query time.
- **Not every facet needs a Mosaic.** If a facet has no clear musical association, leave it unmapped. The system will fall back gracefully to other gates for music selection.
