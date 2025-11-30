# Movie UI Layer Analysis

## Summary
This document provides a comprehensive analysis of movie-related code in the UI layer (`src/ui/`). Currently, all movie data flows through the generic `PrismMediaItem` type throughout the application.

---

## Current Type Definition

### `PrismMediaItem` (types.d.ts)
```typescript
type PrismMediaItem = {
  mediaItemId: string;
  title?: string;
  alias?: string;
  imdb?: string;
  tags: string[];
  path?: string;
  duration?: number;
  durationLimit?: number;
  overDuration?: boolean;
  firstEpisodeOverDuration?: boolean;
  collections?: PrismCurationReference[];
  blocks?: PrismCurationReference[];
  episodeCount?: number;
  episodes?: PrismEpisodeItem[];
};
```

**Note:** `PrismMediaItem` is used for ALL media types (movies, shows, shorts, music, commercials, promos, bumpers). Movies specifically only use: `mediaItemId`, `title`, `path`, `tags`, `alias`, `imdb`, and `duration`/`durationLimit` properties.

---

## Files That Reference Movies in UI Layer

### 1. **Services Layer** (`src/ui/services/media/`)

#### `useMovies.ts` - Core movie data fetching & mutations
**Purpose:** React Query hooks for all movie CRUD operations

**Functions:**
- `useGetAllMovies()` - Fetches all movies via IPC
  - Returns: `Promise<PrismMediaItem[]>`
  - Cache key: `["movies"]`
  - Stale time: 6 hours
  
- `useCreateMovie()` - Creates new movie
  - Mutates: `window.electron.createMovieHandler(body: PrismMediaItem)`
  - Invalidates: `["movies"]` query
  
- `useDeleteMovie()` - Deletes movie
  - Mutates: `window.electron.deleteMovieHandler(body: PrismMediaItem)`
  - Invalidates: `["movies"]`, `["collections"]` queries
  
- `useUpdateMovie()` - Updates existing movie
  - Mutates: `window.electron.updateMovieHandler(body: PrismMediaItem)`
  - Invalidates: `["movies"]`, `["collections"]` queries

**Key Point:** All functions use `PrismMediaItem` for type safety

#### `index.ts` - Service barrel export
- Exports all from `useMovies.ts`

---

### 2. **Screen Components** (`src/ui/screens/Movies/`)

#### `Movies.tsx` - Entry component
**Purpose:** Connects view to view model

```tsx
function Movies() {
  const navigate = useRootStack();
  const viewModel = useMoviesViewModel(navigate);
  return <MoviesView viewModel={viewModel} />;
}
```

---

#### `View/Movies.viewmodel.ts` - Business logic
**Purpose:** Manages all movie screen state and operations

**State:**
```typescript
interface MoviesData {
  movies: PrismMediaItem[];                    // Combined new + saved
  selectedMovie: PrismMediaItem | null;        // Currently editing
  isEditModalOpen: boolean;
}

interface MoviesActions {
  editMovie: (movie: PrismMediaItem) => void;
  saveMovie: (movie: PrismMediaItem) => void;
  onRemove: (movie: PrismMediaItem) => void;
  addMovies: () => void;
}

export interface MoviesViewModel extends MoviesData, MoviesActions {}
```

**Key Operations:**
1. **Fetch Movies** - Uses `useGetAllMovies()` hook
   - Updates `savedMovies` state from query data
   - Combines with `newMovies` to form complete list

2. **Add Movies** - `addMovies()` function
   - Opens file dialog via `window.electron.openFileDialogHandler()`
   - Creates new items with: `mediaItemId`, `path`, `tags: []`
   - Adds to `newMovies` state

3. **Edit Movie** - `editMovie(movie: PrismMediaItem)`
   - Finds movie in combined list
   - Sets as `selectedMovie`
   - Opens edit modal

4. **Save Movie** - `saveMovie(movie: PrismMediaItem)`
   - Deep clones movie object
   - Checks if exists in `savedMovies`
   - If exists: calls `$updateMovie.mutate()`
   - If new: calls `$createMovie.mutate()`
   - Removes from `newMovies` on success

5. **Delete Movie** - `onRemove(item: PrismMediaItem)`
   - If in `newMovies`: removes locally only
   - If in `savedMovies`: calls `$deleteMovie.mutate()`

---

#### `View/Movies.view.tsx` - Presentation
**Purpose:** Renders movie list UI

**Props:**
```typescript
interface MoviesViewProps {
  viewModel: MoviesViewModel;
}
```

**Component Structure:**
- Passes `viewModel.movies` to `<MediaItemList />`
- Passes handlers: `editMovie`, `saveMovie`, `onRemove`, `addMovies`
- Defaults `selectedMovie` to empty object with required fields
- Sets `type="movie"` for the list component

---

### 3. **Shared Components**

#### `src/ui/components/MediaItemList/MediaItemList.tsx`
**Purpose:** Generic list component displaying movies (and other media types)

**Props:**
```typescript
interface MediaItemListProps {
  mediaList: PrismMediaItem[];
  type: string;                    // "movie", "show", "short", etc.
  isEditModalOpen: boolean;
  selectedItem: PrismMediaItem;
  onEdit: (item: PrismMediaItem) => void;
  onSave: (item: PrismMediaItem) => void;
  onRemove: (item: PrismMediaItem) => void;
  onAddItem: () => void;
}
```

**Features:**
- Searches movies by title (case-insensitive, 600ms debounce)
- Maps over `mediaList` rendering `<MediaListItem />` for each
- Renders `<MediaEditForm />` in modal when `isEditModalOpen=true`

---

#### `src/ui/components/MediaItemList/MediaListItem/MediaListItem.tsx`
**Purpose:** Individual movie item in list

**Props:**
```typescript
interface MediaListItemProps {
  item: PrismMediaItem;
  setNewTitle: (title: string) => void;
  onEdit: (item: PrismMediaItem) => void;
  onSave: (item: PrismMediaItem) => void;
  onRemove: (item: PrismMediaItem) => void;
}
```

---

#### `src/ui/components/MediaEditForm/MediaEditForm.tsx`
**Purpose:** Generic edit form for all media types

**Props:**
```typescript
interface MediaEditFormProps {
  item: PrismMediaItem;
  itemType: string;               // "movie", "show", etc.
  incomingTitle: string;
  hasOriginalTitle: boolean;
  onSave: (item: PrismMediaItem) => void;
  onCancel: (item: PrismMediaItem) => void;
}
```

**Movie-Specific Fields Used:**
- `title` - Movie title
- `alias` - Alternative name
- `imdb` - IMDB URL
- `tags` - String array of tag IDs
- `path` - File path
- `duration` / `durationLimit` - Duration tracking

**Not Used for Movies:**
- `episodes` - Only for shows
- `episodeCount` - Only for shows
- `collections` / `blocks` - Curation references
- `overDuration` / `firstEpisodeOverDuration` - Show-specific

---

### 4. **Collections (Uses Movies)**

#### `src/ui/screens/Collections/View/Collections.viewmodel.ts`
**Purpose:** Collection curation using movies as items

**State:**
```typescript
movies: PrismMediaItem[];  // Fetched from useGetAllMovies()
```

**Usage:**
- Fetches all movies via `useGetAllMovies()` hook
- Passes to curation form so users can add movies to collections
- Movies appear in the media list for selection

**Related Components:**
- `CurationItemList` - Displays collections with movies
- `MediaItem` - Individual movie in available list
- `AddedMediaItem` - Movie added to collection

---

### 5. **IPC & Type Definitions** (types.d.ts)

#### Window.electron handlers for movies
```typescript
getMoviesHandler: () => Promise<PrismMediaItem[]>;
createMovieHandler: (movie: PrismMediaItem) => Promise<{ message: string; status: number }>;
deleteMovieHandler: (movie: PrismMediaItem) => Promise<{ message: string; status: number }>;
updateMovieHandler: (movie: PrismMediaItem) => Promise<{ message: string; status: number }>;
```

#### EventPayloadMapping
```typescript
getMovies: Promise<PrismMediaItem[]>;
createMovie: Promise<{ message: string; status: number }>;
deleteMovie: Promise<{ message: string; status: number }>;
updateMovie: Promise<{ message: string; status: number }>;
```

---

## Data Flow

```
Movies Screen Entry (Movies.tsx)
    ↓
View Model (Movies.viewmodel.ts)
    ├─ Fetches: useGetAllMovies() 
    │    └─ IPC: window.electron.getMoviesHandler()
    │         └─ Electron: src/electron/handlers/movieHandlers.ts
    │              └─ HTTP: localhost:3001/api/admin/v1/get-movies
    │
    ├─ Manages State: savedMovies[], newMovies[], movies[], selectedMovie
    │
    └─ Provides Actions: editMovie(), saveMovie(), addMovies(), onRemove()
           ├─ saveMovie uses: 
           │   ├─ $updateMovie.mutate() → window.electron.updateMovieHandler()
           │   └─ $createMovie.mutate() → window.electron.createMovieHandler()
           │
           └─ onRemove uses: $deleteMovie.mutate() → window.electron.deleteMovieHandler()
    
    ↓
View (Movies.view.tsx)
    └─ Renders: <MediaItemList mediaList={viewModel.movies} />
    
    ↓
MediaItemList Component
    ├─ Displays: filtered movie list
    ├─ Search: filters movies by title
    └─ Edit Modal: <MediaEditForm item={selectedMovie} />
    
    ↓
MediaEditForm Component
    ├─ Fields: title, alias, imdb, tags, path, duration, durationLimit
    └─ Callbacks: onSave() → viewModel.saveMovie()
```

---

## Key Points for PrismMediaItem → Movie Conversion

### Critical Change Points (UILayer)

1. **useMovies.ts**
   - `useGetAllMovies()` return type: `Promise<PrismMediaItem[]>` → `Promise<Movie[]>`
   - All mutation functions: parameter `body: PrismMediaItem` → `body: Movie`

2. **Movies.viewmodel.ts**
   - All state: `PrismMediaItem[]` → `Movie[]`
   - Function parameters: `(movie: PrismMediaItem)` → `(movie: Movie)`
   - Interface types: `movies: PrismMediaItem[]` → `movies: Movie[]`

3. **Movies.view.tsx**
   - Component receives same types automatically via interface

4. **MediaItemList.tsx**
   - Props: `mediaList: PrismMediaItem[]` → `mediaList: Movie[]`
   - Props: `selectedItem: PrismMediaItem` → `selectedItem: Movie`
   - All callback parameters change accordingly

5. **MediaEditForm.tsx**
   - Props: `item: PrismMediaItem` → `item: Movie`
   - Props: callback parameters change

6. **Collections.viewmodel.ts**
   - `movies: PrismMediaItem[]` → `movies: Movie[]`
   - Still used alongside `PrismCurationItem` for collection items

7. **types.d.ts**
   - `getMoviesHandler: () => Promise<PrismMediaItem[]>` → `Promise<Movie[]>`
   - All movie handlers: parameter types change to `Movie`
   - EventPayloadMapping: `getMovies` return type changes

### Components NOT Affected (Generic)

These use `PrismMediaItem` generically for ALL media types, so only change if you want to support multiple types:
- `MediaListItem.tsx`
- `MediaEditForm.tsx` 
- `BufferItemList.tsx`
- `CurationEditForm/` components
- Tag edit components (semantic layer)

---

## Type Hierarchy Impact

### Before
```
PrismMediaItem (universal type)
├─ Used for: Movies, Shows, Shorts, Music, etc.
└─ Contains all possible properties from all media types
```

### After
```
Movie (specific type)
├─ Used for: Movies only
├─ Contains: mediaItemId, title?, alias?, imdb?, tags, path?, duration?, durationLimit?
└─ Shows, Shorts, etc. get their own specific types

Generic Component Issue:
├─ MediaItemList<PrismMediaItem> currently works for all
├─ After change: MediaItemList<Movie> only works for movies
└─ Solution: Make components generic or keep PrismMediaItem for generic components
```

---

## Recommendation for Minimal Breaking Changes

### Option 1: Targeted Movie Type (Least Breaking)
- Create `Movie` type in `types.d.ts`
- Change ONLY movie-specific code in movies screen
- Keep generic components using `PrismMediaItem`
- Collections can map `Movie[]` to `PrismMediaItem[]` locally

### Option 2: Universal Refactor (Most Breaking)
- Create `Movie`, `Show`, `Short`, `Music` types
- Create generic `MediaItem<T>` component
- Update all screens
- Update type definitions

---

## Summary Table

| File | Type Usage | Impact | Action Required |
|------|-----------|--------|-----------------|
| `useMovies.ts` | All functions use `PrismMediaItem` | HIGH | Change to `Movie` |
| `Movies.viewmodel.ts` | All state & functions | HIGH | Change to `Movie` |
| `Movies.view.tsx` | Via viewmodel interface | HIGH | Automatic via interface |
| `MediaItemList.tsx` | Generic props | MEDIUM | Keep generic OR change to `Movie` |
| `MediaEditForm.tsx` | Generic component | MEDIUM | Keep generic OR change to `Movie` |
| `Collections.viewmodel.ts` | `movies: PrismMediaItem[]` | MEDIUM | Change to `Movie[]` |
| `types.d.ts` | IPC handler signatures | HIGH | Change all movie handlers |
| Electron layer | `movieHandlers.ts` | HIGH | Change signatures (mirrors types.d.ts) |

---

## Next Steps for Implementation

1. **Define Movie type** in `types.d.ts`
2. **Update types.d.ts** IPC handler signatures
3. **Update useMovies.ts** all function types
4. **Update Movies.viewmodel.ts** all state and function params
5. **Update Collections.viewmodel.ts** movie state type
6. **Update Electron layer** to match type definitions
7. **Update generic components** (optional - if making them media-specific)
