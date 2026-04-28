# Media Types

Kaleidoscope works with eight distinct media types, split into two categories based on their role in the stream. Anchor media is the main content: the movies and episodes that establish the schedule and drive the thematic direction of everything around them. Buffer media is everything else: the shorter material that fills the gaps between anchors and gives the channel its personality.

Every media item is tagged with whatever taxonomy labels apply to it, and those tags are what the stream construction system uses to make selection and transition decisions. Tags are the connective tissue between types. Without them, every piece of media is just a file with a duration.

---

## Anchor Media

Anchor media is what the stream is scheduled around. In cadenced mode, anchors always start on the hour or half-hour. Everything else in the stream exists to support them.

### Movie

A movie is a standalone film. It has a single path, a measured duration, and a duration limit that tells the stream construction system which cadence slot to place it in. A movie set to a 90-minute duration limit will always occupy a 90-minute slot, even if the film itself runs a few minutes shorter, and the remaining time will be filled by its buffer.

Movies are tracked for recent usage. The system won't schedule the same movie within a 48-hour window, so the channel doesn't start repeating itself. If every eligible movie has been recently used, the system falls back gracefully rather than refusing to pick anything.

Movies can be marked as holiday-exclusive, which restricts them to playing only when a matching holiday tag is active on the calendar.

### Show and Episode

Shows are the other half of anchor media. In Kaleidoscope, a show is a container and an episode is the actual playable item. When the stream selects a show, it's really selecting the next episode in its progression sequence.

The show itself carries a duration limit that defines what time slot it fits into: a 30-minute slot for standard half-hour series, a 60-minute slot for hour-long dramas. Individual episodes belong to that show and carry their own measured duration. Most of the time an episode fits cleanly within its show's slot. Occasionally an episode runs long, such as a season finale or a holiday special, and the `overDuration` flag marks that case so the stream can handle it without misaligning the schedule.

Shows also carry two sets of tags. Primary tags describe the show as a whole and drive thematic selection. Secondary tags are supplementary labels that can capture additional thematic attributes without overriding the main classification. This matters for shows that span tones or shift meaningfully between seasons.

Episode progression persists to the database. If the app closes and reopens, the stream remembers where it left off in every show and continues from the correct episode rather than starting over.

---

## Buffer Media

Buffer media fills the gaps between anchors. When a 22-minute episode occupies a 30-minute slot, the eight minutes that remain need to be filled. The buffer constructor calculates that gap, selects content to fill it precisely, and assembles it into a sequence. No dead air, no leftover time.

The buffer for any given anchor is split in two. The first half is matched thematically to the anchor that just finished. The second half is matched to the anchor coming up next. A promo bridges them in the middle. The result is that buffer sections function as transitions, not just filler, easing the viewer from one piece of content to the next rather than cutting abruptly.

### Commercial

A commercial is any piece of media that runs between 10 seconds and 2 minutes. The name is inherited from broadcast television but the type isn't limited to actual advertising. Anything short enough to drop into a commercial break slot qualifies: a vintage PSA, an interstitial animation, a short clip, a network card, a song with a video component that happens to be very brief. The defining characteristic is the duration range, not the content type.

Commercials are the most numerous buffer type by design. Because they're short, multiple them can be combined to fill almost any gap precisely. Kaleidoscope ships with a default library of them in varying lengths to ensure the buffer constructor can always find an exact fit.

Commercials are tagged like any other media and participate in the thematic matching system, so even the commercial break can reflect the tone of what surrounds it.

### Short

A short is a piece of content that runs longer than two minutes but shorter than a feature. Short films, animated shorts, documentary segments, extended video essays, and similar things belong here. The floor is two minutes to distinguish them from commercials. There's no hard ceiling, but in practice a short should be brief enough that it fits inside a buffer gap without consuming too much of it.

Shorts are tagged and participate in the same thematic matching as everything else. A well-tagged library of shorts can function as thoughtful connective tissue inside a buffer, giving the break between two anchors more weight than a block of commercials alone.

### Music

Music covers music videos, animated visualizers, and any other video-driven piece of audio content. The music type has one field that none of the others do: an artist name, since attributing music properly is its own concern separate from the title.

Music is also the only buffer type with its own taxonomy dimension. Rather than using the same genre and aesthetic tags as visual media, music is tagged with musical genres, and the Mosaic system maps those musical genres to the narrative facets of the anchors surrounding them. A dark urban thriller facet maps to genres like Synthwave or Jazz Noir. A high-fantasy adventure facet maps to orchestral and folk. The result is that the music inside a buffer doesn't just fill time; it reinforces the emotional texture of what it's placed next to.

### Promo

A promo is a short channel identifier, typically 5 to 15 seconds. Think of the NBC peacock, the Cartoon Network logo bumps, or the old Nickelodeon splat. One promo appears per buffer, placed at the midpoint between the two halves of the commercial break. It acts as a reset point, a moment that acknowledges the transition between one anchor and the next.

Kaleidoscope ships with its own default branded promos. Users can add their own to build a custom channel identity, or lean into a specific era of television by using promos that match the aesthetic of their library.

Unlike commercials, shorts, and music, promos are selected randomly rather than thematically. The promo is a station identity element, not a narrative one, and its selection doesn't need to mirror the content around it.

### Bumper

A bumper is a short transitional clip that can be placed at the seams between content. The type is defined and taggable in the system, but bumper placement in the buffer constructor is not yet active. When it is, bumpers will serve as the very brief moments of transition that network television used to signal that something was ending or beginning, a few seconds of music or animation that told you the break was over.
