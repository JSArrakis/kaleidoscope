# Facets - Intelligent Media Transitions Through Taxonomic Relationships

In the early stages of developing Kaleidoscope's procedural media selection, it became clear that simply having rich taxonomies wasn't enough. Having detailed Genre and Aesthetic classifications for every piece of media was valuable, but the system still needed a way to understand _how_ different taxonomic combinations related to each other. How do you transition smoothly from a Cyberpunk Thriller to something else? What makes a good follow-up to a Family Fantasy Adventure? The answer lay in creating a system that could map the relationships between different taxonomic combinations and use those relationships to guide intelligent transitions.

This challenge led to the development of the Facets system - a sophisticated relationship engine that treats combinations of Genre and Aesthetic tags as discrete "facets" and measures the compatibility distances between them. Like light refracting through the facets of a kaleidoscope, media selection in Kaleidoscope refracts through these taxonomic relationships to create smooth, intelligent transitions that maintain thematic coherence while introducing variety.

## The Core Problem: Taxonomic Transition Gaps

While Kaleidoscope's six taxonomies provide rich descriptive data about media, they don't inherently tell us how to move between different combinations. Consider these scenarios:

- You're currently playing a **Cyberpunk Thriller** (Blade Runner). What's a good next selection: a **Space Opera Action** film (Guardians of the Galaxy), a **Noir Mystery** (The Big Sleep), or a **Post-Apocalyptic Horror** (Mad Max: Fury Road)?

- A **Family Fantasy Adventure** (The Princess Bride) just ended. Should you transition to a **Kids Adventure** (The Goonies), a **Family Comedy** (Home Alone), or a **Young Adult Fantasy** (Harry Potter)?

- You're in the middle of a **Gothic Horror** block and want to ease viewers toward lighter content. What's the most natural bridge?

Without understanding the relationships between these taxonomic combinations, procedural selection becomes either random (destroying thematic coherence) or overly rigid (creating repetitive loops). The Facets system solves this by treating each Genre + Aesthetic combination as a distinct "facet" and building a network of measured relationships between them.

## How Facets Work: The Distance Matrix

At its core, the Facets system operates on the principle that every combination of Genre and Aesthetic tags represents a unique "facet" - a point in taxonomic space that describes a specific type of media experience. The system then measures the "distance" between these facets, creating a network of relationships that guides transition decisions.

### Facet Formation

Ideally, a facet is created by combining one Genre tag with one Aesthetic tag:

- **Action + Cyberpunk** = "action_cyberpunk" facet
- **Horror + Gothic** = "horror_gothic" facet
- **Adventure + Fantasy** = "adventure_fantasy" facet
- **Comedy + Contemporary** = "comedy_contemporary" facet

However, the system must handle real-world tagging scenarios where media may have incomplete taxonomic classification. The Facets system addresses this through **Default Facets**:

#### Complete Facets vs. Default Facets

**Complete Facets** (Genre + Aesthetic): When media has both taxonomic dimensions tagged:

- Arrival tagged with [Sci-Fi] + [Modern] → "scifi_modern" facet
- Blade Runner tagged with [Thriller] + [Cyberpunk] → "thriller_cyberpunk" facet

**Default Facets** (Single Taxonomy + "Default"): When media has only one dimension tagged:

- Arrival tagged with only [Sci-Fi] → "scifi_default" facet
- A romantic comedy tagged with only [Contemporary] → "default_contemporary" facet
- Untagged media → "default_default" facet (emergency fallback)

#### Default Facet Behavior

Default facets serve as **taxonomic wildcards** in the system:

- **"scifi_default"** represents "Science Fiction with unspecified aesthetic" and can transition reasonably to scifi_cyberpunk, scifi_space_opera, scifi_modern, etc.
- **"default_contemporary"** represents "Contemporary aesthetic with unspecified genre" and can connect to thriller_contemporary, drama_contemporary, comedy_contemporary, etc.
- **"default_default"** acts as the universal connector when no taxonomic information exists

#### Multi-Facet Participation

Each piece of media can participate in multiple facets based on its available tags:

- **Complete tagging**: [Action, Thriller] + [Cyberpunk, Noir] → four facets: action_cyberpunk, action_noir, thriller_cyberpunk, thriller_noir
- **Partial tagging**: [Action, Thriller] + no aesthetic → two default facets: action_default, thriller_default
- **Mixed tagging**: [Action] + [Cyberpunk, Noir] → two facets: action_cyberpunk, action_noir

### Distance Measurement

The "distance" between two facets represents how compatible they are for sequential viewing. This distance is measured on a scale from 0.0 (perfectly compatible) to 1.0 (highly incompatible):

- **0.0 - 0.2**: Nearly identical experiences (action_cyberpunk → thriller_cyberpunk)
- **0.2 - 0.4**: Closely related, smooth transition (adventure_fantasy → adventure_medieval)
- **0.4 - 0.6**: Moderate relationship, noticeable but acceptable shift (drama_contemporary → comedy_contemporary)
- **0.6 - 0.8**: Distant relationship, requires careful handling (horror_gothic → comedy_family)
- **0.8 - 1.0**: Highly incompatible, avoid direct transitions (kids_adventure → adult_horror)

#### Default Facet Distance Rules

Default facets follow special distance calculation rules to handle incomplete taxonomic information:

**Default-to-Complete Transitions** (moderate compatibility):

- scifi_default → scifi_cyberpunk = **0.3** (same genre, compatible aesthetic)
- scifi_default → thriller_cyberpunk = **0.5** (different genre, but sci-fi often contains thriller elements)
- default_contemporary → drama_contemporary = **0.3** (same aesthetic, compatible genre)

**Default-to-Default Transitions** (neutral compatibility):

- scifi_default → action_default = **0.5** (different taxonomies, moderate uncertainty)
- default_contemporary → default_noir = **0.5** (different aesthetics, moderate uncertainty)
- default_default → any_facet = **0.6** (high uncertainty, but not incompatible)

**Complete-to-Default Transitions** (reverse lookup):

- Uses same distances as default-to-complete, allowing smooth degradation when moving from well-tagged to poorly-tagged content

This system ensures that media with incomplete tagging can still participate meaningfully in the transition network without creating jarring jumps or getting isolated from well-tagged content.

### The Learning Algorithm

What makes the Facets system intelligent is its ability to learn and adapt based on user feedback. When viewers respond positively or negatively to specific transitions, the system adjusts the distance scores accordingly:

- **Positive feedback** decreases the distance between facets (making future transitions more likely)
- **Negative feedback** increases the distance (making transitions less likely)
- **Neutral or no feedback** maintains existing distances

This creates a personalized transition network that evolves to match each user's preferences while maintaining general compatibility principles.