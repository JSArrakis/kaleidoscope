[HOME](../index.md)

# Collections

Collections are the mechanism Kaleidoscope uses to preserve the sequential narrative of movie series. Where a Specialty tag might group all of the films in a franchise together under a shared label, a collection goes further and defines a strict, ordered sequence that the stream is expected to respect. If you build a collection out of the Indiana Jones films and arrange them in the order you want them seen, the stream will follow that order rather than treating the films as interchangeable entries in a loose thematic pool.

The distinction matters because not every franchise grouping implies a viewing order, and not every viewing order is the same. A Specialty tag says "these films belong together." A collection says "these films belong together and in this sequence." Both can coexist on the same movies simultaneously. You might tag a series of films with a Specialty for general franchise awareness and also maintain a collection that enforces a particular viewing order for marathon sessions, and the two will not interfere with each other.

## Building a Collection

Collections are managed from the Collections screen in the app. A collection has a title, an optional description, and an ordered list of movies. You add films to the collection one at a time, arranging them in the sequence you want the stream to follow. That sequence is preserved precisely. The stream will not reorder the films, skip entries arbitrarily, or randomize within the collection once it is in motion.

Each film belongs to at most one collection. This is an intentional constraint. A film that sits at the intersection of multiple franchise groupings would create an ambiguous progression state: if Alien plays and then Predator plays and AVP is a member of both the Alien and Predator collections, the system has no reliable way to determine which sequence is currently active. By restricting each film to a single collection, the selection logic always has a clear, unambiguous answer about whether a sequence is in progress and what comes next.

## How the Stream Uses Collections

When the stream selects a movie and that movie belongs to a collection, the system checks whether a sequence from that collection is already in progress in the current stream context. If it is, the stream moves to the next film in the sequence instead of treating the new selection as independent. If no sequence is active, the selected film simply starts one, and future selections from that collection will continue from where it left off.

This behavior is scope-aware. The continuous stream, ad hoc streams, and each individual programming block each maintain their own independent record of where they are inside any given collection. A Star Wars marathon running inside a Saturday programming block does not advance the Star Wars progression that plays organically through the continuous stream during the rest of the week. The two contexts track their own positions entirely separately, and neither one is aware of what the other has played.

The scope tracking also carries a time window. If a collection was last advanced within the past twelve hours in a given context, the stream treats the sequence as active and will push the next film in order even if the selection logic would have chosen something else. If more than twelve hours have passed since a film from that collection played in a particular context, the system treats the sequence as effectively cold. The next time a film from the collection appears in that context, it will start a fresh progression rather than resuming from a position that may no longer be relevant to the current session.

When a collection reaches its final film, it wraps. The next time the stream draws from that collection in the same context, it begins again from the first entry.

## Collections and Programming Blocks

Programming blocks that are built around a curated movie marathon draw from a collection to define their film order. The block advances through the collection sequence each time it fires, picking up from the last film it played the previous time it ran. Because that progression is scoped to the block's own identifier, it is completely isolated from any other context drawing from the same collection. Two different programming blocks can run the same collection at different times, and neither one will move the other's position forward.
