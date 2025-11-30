# Model Alignment Analysis for Kaleidoscope Integration

## Database Location Strategy

**Old Service:** Uses `%APPDATA%/Kaleidoscope/kaleidoscope.db` (or `~/Kaleidoscope/` on non-Windows)

**Proposed for Prism Electron:**

- Use Electron's `app.getPath('userData')` which resolves to:
  - **Windows:** `%APPDATA%/Prism/` or similar
  - **macOS:** `~/Library/Application Support/Prism/`
  - **Linux:** `~/.config/Prism/` (or XDG default)
- This keeps the database in the standard user app data location
- File: `kaleidoscope.db` inside the userData path

**Implementation:** Create `src/electron/db/pathResolver.ts` to centralize database path resolution

---

## Key Model Differences Between Old Service and Prism

### 1. **Tag Structure**

**Old Service (Tag.ts):**

```typescript
- tagId: string
- name: string
- type: TagType (enum: Era, Genre, Aesthetic, Specialty, AgeGroup, Holiday, MusicGenre)
- subgenres?: Subgenre[]
- seasonStartDate?: string (for Era/Holiday)
- seasonEndDate?: string (for Era/Holiday)
- holidayDate?: string (for Holiday)
- sequence?: number
- explicitlyHoliday?: boolean
```

**Prism (types.d.ts - Tag):**

```typescript
- tagId: string
- name: string
- subgenres?: Subgenre[]
- seasonStartDate?: string
- seasonEndDate?: string
- holidayDate?: string
- sequence?: number
```

**Difference:** Old service has explicit `type` field; Prism infers from context (AgeGroups, Holidays, etc. stored separately)

**Alignment Needed:** Decide whether to:

- Add `type` field to Prism Tag (more explicit, cleaner for streaming logic)
- Keep separate tag types as buckets (current Prism approach)
- Recommend: Add `type` field for consistency

---

### 2. **Episode/Show Structure**

**Old Service (Show.ts):**

```typescript
Episode:
- season: string
- episode: string
- episodeNumber: number
- path: string
- title: string
- mediaItemId: string
- showItemId: string
- duration: number
- durationLimit: number
- overDuration: boolean
- type: MediaType.Episode
- tags: Tag[] (array of Tag objects)

Show:
- All BaseMedia properties (id, title, etc.)
- alias: string
- imdb: string
- durationLimit: number
- firstEpisodeOverDuration: boolean
- secondaryTags: Tag[]
- episodeCount: number
- episodes: IEpisode[]
```

**Prism (types.d.ts - PrismMediaItem):**

```typescript
PrismMediaItem:
- mediaItemId: string
- title?: string
- alias?: string
- imdb?: string
- tags: string[] (array of tag NAMES, not Tag objects)
- path?: string
- duration?: number
- durationLimit?: number
- overDuration?: boolean
- firstEpisodeOverDuration?: boolean
- collections?: PrismCurationReference[]
- blocks?: PrismCurationReference[]
- episodeCount?: number
- episodes?: PrismEpisodeItem[]

PrismEpisodeItem:
- mediaItemId: string
- title: string
- season?: string
- episode?: string
- episodeNumber?: number
- path: string
- duration?: number
- durationLimit?: number
- tags: string[] (array of tag NAMES)
```

**Differences:**

1. Old service uses Tag objects everywhere; Prism uses tag name strings
2. Old service has `showItemId` on episodes; Prism doesn't
3. Old service distinguishes `secondaryTags`; Prism doesn't
4. Old service uses MediaType enum; Prism infers from handler context

**Alignment Needed:**

- Tags should be resolved to Tag objects during repository queries for streaming logic
- Keep tag storage as strings in DB/IPC for simplicity
- Repository layer resolves string tags to Tag objects when needed

---

### 3. **Collections/Blocks Structure**

**Old Service:**

- `Block` - Explicit curatorial block (doesn't exist directly in Prism)
- `Collection` - Different from Block

**Prism:**

- `PrismCurationObj` - Single generic curation structure
- Used for both Collections and Blocks via context

**Alignment Needed:**

- Streaming logic needs explicit Block concept
- Consider whether to rename/clarify in data model

---

### 4. **Facets (New Concept for Old Service)**

**Old Service (Facet.ts):**

```typescript
- facetId: string
- genre: Tag
- aesthetic: Tag
- relationships: FacetRelationship[] (links to other facets with distance metric)
```

**Prism:**

- No facet concept exists

**Alignment Needed:**

- Add Facet support to Prism database and types
- Used by procedural engine for intelligent media selection

---

### 5. **MediaType Enum**

**Old Service:**

```typescript
enum MediaType {
  Movie = "movie",
  Show = "show",
  Episode = "episode",
  Short = "short",
  Music = "music",
  Commercial = "commercial",
  Promo = "promo",
  Bumper = "bumper",
}
```

**Prism:**

- Inferred from handler/context
- No explicit enum

**Alignment Needed:**

- Add MediaType enum to Prism for consistency

---

## Recommended Model Unification Strategy

### Phase 1: Minimal Changes

1. Keep Prism's current structure
2. Add repository layer that queries Prism's existing database
3. Repositories convert Prism data to old service models as needed
4. Avoid modifying Prism's handlers/UI

### Phase 2: Optional Enhancement (Later)

1. Add `type` field to Tag
2. Add Facet support to database
3. Normalize repository queries

### Phase 3: Full Unification (Future)

1. Merge data models completely
2. Update all handlers to work with unified models
3. Single source of truth for data

---

## Action Items for Sub-Task 2.1

1. **Confirm alignment strategy** - Which phase to pursue?
2. **Document schema** - Map old service tables to Prism structure
3. **Tag resolution layer** - Create utility to convert tag names ↔ Tag objects
4. **Facet handling** - Decide if adding to existing DB or separate storage
5. **Database initialization** - Ensure new tables created if missing from old Prism DB
