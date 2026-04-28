# Kaleidoscope — Work In Progress

## Stream Construction

- [ ] Integrate programming blocks into stream construction and stream iteration
- [ ] Wire Mosaic into Spectrum buffer selection (facet → musical genre for music video theming)
- [ ] Place bumpers in buffer constructor

## Playback

- [ ] Implement Electron player (`addMediaBlockToPlayer`)
- [ ] Implement VLC service (all stubs)
- [ ] Implement FFmpeg stream service (Plex/Jellyfin output)
- [ ] Add MP3 support with ffmpeg visualizer for buffer audio

## UI Screens

- [ ] Home — stream controls, On Deck/Upcoming display, player controls
- [ ] Cascade — timeline visualization of the day's schedule
- [ ] Mosaic — facet → musical genre mapping UI
- [ ] Facets — facet relationship management UI
- [ ] Blocks — uncomment and wire up the CurationItemList
- [ ] Settings — surface user-configurable options

## Docs

- [ ] `docs/prisms/index.md` (empty)
- [ ] `docs/prisms/spectrum.md` (empty)
- [ ] `docs/prisms/mosaics/` (empty or missing)

## Completed

- [x] Implement uncadenced continuous stream paths (`Cadence: false`, both Themed and Random)
- [x] Implement adhoc stream builder (all 4 mode combinations: Cadenced/Uncadenced × Themed/Random)
- [x] Add `AdhocStartFromBeginning` flag (default ep 1 vs random episode start per session)
- [x] Update BackendArchitecture.md to cover all four modes, adhoc section, ephemeral progression
