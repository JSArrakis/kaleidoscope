[HOME](../index.md)

# The Prism System

If [taxonomies](../taxonomies/index.md) are the raw spectrum of data describing media, prisms are how Kaleidoscope bends and refracts that spectrum into programming decisions. They are the rulesets, filters, and weighting systems that interpret media attributes and translate them into meaningful selections for the continuous stream.

The Prism System has three components:

## [Facets](facets/index.md)

Facets define the relationship graph between thematic identities. Each facet is a Genre + Aesthetic pairing (e.g. "Thriller + Noir") that creates a distinct thematic identity. Facets are connected to other facets through measured distances, allowing the stream to "walk" from one identity to another — selecting anchor media that feels thematically connected but not identical. This is how a Sci-Fi Noir movie naturally transitions to a Thriller Cyberpunk show rather than jumping to a Family Comedy.

## [Spectrum](spectrum.md)

Spectrum handles buffer media selection — finding the commercials, shorts, and music that fill the gaps between anchor media. It uses a gated pool expansion strategy, starting with the most thematically specific content and progressively widening the search until there's enough variety to sustain multiple buffers without repetition. Six gates (Holiday → Specialty → Genre/Aesthetic → Age Group → Untagged → Random) ensure that every buffer can be filled, regardless of how well-tagged the library is.

## [Mosaic](mosaics/index.md)

Mosaic bridges the gap between the visual taxonomy (Genre, Aesthetic) and the musical taxonomy (Musical Genres). Because genre and aesthetic tags describe narrative and visual qualities that don't apply to music, Mosaics map each Facet to a curated set of musical genre tags. When the stream is playing a Cyberpunk Thriller, the buffer music can be Synthwave or Darkwave — not because anyone tagged it that way, but because the Mosaic for that facet says those genres belong together. Mosaic operates exclusively within Spectrum's Gate 3.

---

For the technical implementation of these systems, see [Backend Architecture §7](../BackendArchitecture.md#7-the-prism-system--facets--spectrum).
