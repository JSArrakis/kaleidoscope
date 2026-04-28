[HOME](../index.md)

# Programming Blocks

Programming blocks are scheduled stretches of time that give the stream a deliberate structure above and beyond its ordinary procedural flow. Where the continuous stream fills a day by walking through your library according to taxonomies and thematic adjacency, a programming block steps in at a specific time and says: this stretch belongs to something else. For the duration of the block, the normal selection logic steps aside and the block's own rules take over.

The concept is drawn directly from broadcast television. Toonami had a specific start time, a specific lineup of shows in a specific order, and its own promos and bumpers that set it apart from everything else on the channel. TGIF anchored Friday evenings to a predictable rotation of family sitcoms that viewers scheduled their week around. Saturday morning cartoons carved out an entire portion of the weekend as a distinct experience with its own rhythm and personality. Programming blocks brought structure and identity to what would otherwise be an undifferentiated flow of content, and that structure is exactly what Kaleidoscope's block system is designed to reproduce.

## Block Types

There are currently three types of Programming Blocks with more planned. Each one works differently, and each one is suited to a different kind of recurring programming identity.

A **Show Order** block is built around an ordered lineup of shows. You specify which shows belong to the block and in what sequence, and when the block fires the system works through those shows in episode progression order, fitting as many episodes into the allocated time as the duration budget allows. The episode state inside a Show Order block is entirely isolated from the rest of the stream. If a show appears in a block that fires every Friday night, the block picks up from the correct episode each time it runs, and the continuous stream's own record of where it is in that same show is never touched by what happens inside the block. The two track separately and never interfere.

Show Order blocks require the stream to be running in cadenced mode. Each episode needs to start on the hour or half-hour to maintain proper scheduling alignment, so these blocks cannot run in an uncadenced stream. If cadenced mode is off when a Show Order block is scheduled, the block will not execute.

A **Curated Movie Marathon** block is built around a collection. The block draws from the collection in sequence and works through as many films as its duration budget allows. Each time the block fires, it resumes from where it left off during the last time that specific block ran. A weekly Saturday afternoon block running through the Lord of the Rings films will remember whether it reached The Two Towers last time and will continue from the right film the next time the block fires. That progression is scoped entirely to the block's own identifier and is not shared with any other block or stream type, so two different blocks can draw from the same collection without one advancing the other's position.

A **Tag Themed** block selects movies based on taxonomy tags you assign to the block. You give the block a set of tags and a mode for how to apply them, and the block fills its time window with films that match. This type is less prescriptive than the other two: it enforces thematic consistency without locking in a specific order or a defined sequence. A late-night horror block might run every Thursday with a set of Horror and Gothic tags, pulling differently from your library each time it fires. Tag Themed blocks also participate in collection-aware selection, meaning that if a film selected during the block belongs to a collection, the block will try to continue that collection's sequence from wherever the block's own progression for it last left off.

## Scheduling

Every block has a schedule that defines when it should fire. A block can repeat daily, on specific days of the week, on a specific day of each month, on the same date every year, or as a one-time occurrence on a single calendar date (such as a unique event).

Each schedule also carries a time of day. Programming blocks always start on the hour or half-hour, for the same reason that feature media in a cadenced stream starts on those same boundaries. A block can be set to fire at 9:00 or 9:30 but not at 9:15 or 9:45. This alignment is intentional. Blocks need to share the same cadence grid as the rest of the stream so that the transition into a block and back out of it does not disrupt the schedule.

A block also carries a duration in minutes. That duration defines how long the block's window is, and the block fills it by selecting media until the budget runs out. Once the budget is exhausted, control passes back to the stream.

## How Blocks Fit Into the Stream

During stream construction, the builder scans for any programming blocks scheduled to fall within the current stream's time window. When it finds one, it reserves that slot in the timeline and builds the block segment independently. The rest of the stream is constructed around the block rather than through it.

When the block segment is executed, it runs its own selection logic in full isolation. It carries its own episode progression map and its own collection progression record, both tied to the block's identifier so that nothing happening inside the block affects the position state of the surrounding stream. When the block finishes, the stream resumes its ordinary selection logic using whatever thematic context surrounds the gap to choose the next piece of content.

Blocks can be deactivated at any time without being deleted. A deactivated block stops appearing in future stream schedules but retains its configuration, its schedule, and its progression state so that reactivating it later picks up without having to rebuild anything.
