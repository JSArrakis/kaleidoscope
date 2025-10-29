import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { facetRepository } from '../../src/repositories/facetRepository';

// Testing the facetRepository.selectValidRandomFacetCombo function
// This ensures we test the real production data access layer

describe('selectValidRandomFacetCombo Function Test', () => {
  let tempDbPath: string;
  let tempDb: Database.Database;

  beforeAll(async () => {
    // Create temporary database in the test directory
    tempDbPath = path.join(__dirname, 'temp_facet_test.db');
    tempDb = new Database(tempDbPath);

    // Initialize test database schema
    await initializeTestDatabase(tempDb);

    // Load test data
    await loadTestData(tempDb);
  });

  afterAll(() => {
    // Clean up temporary database
    if (tempDb) {
      tempDb.close();
    }
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  });

  describe('selectValidRandomFacetCombo', () => {
    it('should return a valid facet when facets with available media exist', () => {
      const result = facetRepository.selectValidRandomFacetCombo(tempDb);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.genre).toBeDefined();
      expect(result!.aesthetic).toBeDefined();

      // Should be one of our valid combinations
      const validCombos = ['action-dark', 'comedy-light', 'scifi-dark'];
      const resultCombo = `${result!.genre}-${result!.aesthetic}`;
      expect(validCombos).toContain(resultCombo);

      console.log('✓ Selected valid facet:', resultCombo);
    });

    it('should return null when no valid facets exist', () => {
      // Remove all media but keep facets
      tempDb.prepare('DELETE FROM media_tags').run();
      tempDb.prepare('DELETE FROM episode_tags').run();
      tempDb.prepare('DELETE FROM movies').run();
      tempDb.prepare('DELETE FROM episodes').run();

      const result = facetRepository.selectValidRandomFacetCombo(tempDb);

      expect(result).toBeNull();
      console.log('✓ Correctly returned null with no media');

      // Restore data for other tests
      loadTestData(tempDb);
    });

    it('should only return facets that have matching media (consistency test)', () => {
      const results: string[] = [];

      // Test multiple times to ensure consistency
      for (let i = 0; i < 20; i++) {
        const result = facetRepository.selectValidRandomFacetCombo(tempDb);
        if (result) {
          results.push(`${result.genre}-${result.aesthetic}`);
        }
      }

      const uniqueResults = [...new Set(results)];
      console.log('✓ All selected facets over 20 runs:', uniqueResults);

      // Should only get valid combinations (action-dark, comedy-light, scifi-dark)
      // Should never get invalid combinations (action-epic, scifi-epic)
      const validCombos = ['action-dark', 'comedy-light', 'scifi-dark'];
      const invalidCombos = ['action-epic', 'scifi-epic'];

      results.forEach(combo => {
        expect(validCombos).toContain(combo);
        expect(invalidCombos).not.toContain(combo);
      });

      // Should have found at least some results
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle edge cases - orphan media should not affect results', () => {
      // The orphan movie (horror-epic) should not create a valid facet
      // since no facet exists for that combination

      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        const result = facetRepository.selectValidRandomFacetCombo(tempDb);
        if (result) {
          results.push(`${result.genre}-${result.aesthetic}`);
        }
      }

      // Should never get horror-epic even though a movie exists with those tags
      results.forEach(combo => {
        expect(combo).not.toBe('horror-epic');
      });

      console.log('✓ Orphan media correctly ignored, results:', [
        ...new Set(results),
      ]);
    });

    it('should demonstrate SQL query logic with debug output', () => {
      console.log('\n=== DEBUG: Testing SQL Query Step by Step ===');

      // Test facet_info CTE
      const facetInfoQuery = `
        SELECT 
          f.facetId,
          genre_tag.tagId as genre_tag_id,
          genre_tag_data.name as genre_name,
          aesthetic_tag.tagId as aesthetic_tag_id,
          aesthetic_tag_data.name as aesthetic_name
        FROM facets f
        INNER JOIN facet_tags genre_tag ON f.facetId = genre_tag.facetId AND genre_tag.tagType = 'genre'
        INNER JOIN facet_tags aesthetic_tag ON f.facetId = aesthetic_tag.facetId AND aesthetic_tag.tagType = 'aesthetic'
        INNER JOIN tags genre_tag_data ON genre_tag.tagId = genre_tag_data.tagId
        INNER JOIN tags aesthetic_tag_data ON aesthetic_tag.tagId = aesthetic_tag_data.tagId
      `;

      const facetInfo = tempDb.prepare(facetInfoQuery).all() as Array<{
        facetId: string;
        genre_tag_id: string;
        genre_name: string;
        aesthetic_tag_id: string;
        aesthetic_name: string;
      }>;
      console.log(
        'All facet combinations:',
        facetInfo.map(f => `${f.genre_name}-${f.aesthetic_name}`),
      );

      // Test which facets have matching movies
      for (const facet of facetInfo) {
        const movieQuery = `
          SELECT COUNT(*) as count
          FROM media_tags mt1
          INNER JOIN media_tags mt2 ON mt1.mediaItemId = mt2.mediaItemId
          INNER JOIN movies m ON mt1.mediaItemId = m.mediaItemId
          WHERE mt1.tagId = ? AND mt2.tagId = ?
        `;
        const movieCount = tempDb
          .prepare(movieQuery)
          .get(facet.genre_tag_id, facet.aesthetic_tag_id) as { count: number };

        const episodeQuery = `
          SELECT COUNT(*) as count
          FROM episode_tags et1
          INNER JOIN episode_tags et2 ON et1.mediaItemId = et2.mediaItemId
          INNER JOIN episodes e ON et1.mediaItemId = e.mediaItemId
          WHERE et1.tagId = ? AND et2.tagId = ?
        `;
        const episodeCount = tempDb
          .prepare(episodeQuery)
          .get(facet.genre_tag_id, facet.aesthetic_tag_id) as { count: number };

        console.log(
          `${facet.genre_name}-${facet.aesthetic_name}: ${movieCount.count} movies, ${episodeCount.count} episodes`,
        );
      }

      // This test always passes - it's just for debugging
      expect(facetInfo.length).toBeGreaterThan(0);
    });
  });
});

async function initializeTestDatabase(db: Database.Database) {
  // Create all necessary tables with the exact schema from your app

  // Tags table
  db.exec(`
    CREATE TABLE tags (
      tagId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );
  `);

  // Facets table
  db.exec(`
    CREATE TABLE facets (
      facetId TEXT PRIMARY KEY,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Facet tags table
  db.exec(`
    CREATE TABLE facet_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facetId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      tagType TEXT NOT NULL,
      FOREIGN KEY (facetId) REFERENCES facets (facetId),
      FOREIGN KEY (tagId) REFERENCES tags (tagId),
      UNIQUE(facetId, tagType)
    );
  `);

  // Movies table
  db.exec(`
    CREATE TABLE movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      path TEXT NOT NULL,
      mediaItemId TEXT UNIQUE NOT NULL,
      duration INTEGER,
      durationLimit INTEGER,
      overDuration BOOLEAN DEFAULT FALSE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Media tags table
  db.exec(`
    CREATE TABLE media_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mediaItemId) REFERENCES movies (mediaItemId),
      UNIQUE(mediaItemId, tagId)
    );
  `);

  // Shows table
  db.exec(`
    CREATE TABLE shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      path TEXT NOT NULL,
      mediaItemId TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Episodes table
  db.exec(`
    CREATE TABLE episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      showId INTEGER NOT NULL,
      season TEXT NOT NULL,
      episode TEXT NOT NULL,
      episodeNumber INTEGER,
      path TEXT NOT NULL,
      title TEXT,
      mediaItemId TEXT UNIQUE NOT NULL,
      showItemId TEXT,
      duration INTEGER,
      durationLimit INTEGER,
      overDuration BOOLEAN DEFAULT FALSE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (showId) REFERENCES shows (id) ON DELETE CASCADE
    );
  `);

  // Episode tags table
  db.exec(`
    CREATE TABLE episode_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mediaItemId) REFERENCES episodes (mediaItemId),
      UNIQUE(mediaItemId, tagId)
    );
  `);
}

async function loadTestData(db: Database.Database) {
  // Clear existing data
  db.exec(`
    DELETE FROM episode_tags;
    DELETE FROM episodes;
    DELETE FROM shows;
    DELETE FROM media_tags;
    DELETE FROM movies;
    DELETE FROM facet_tags;
    DELETE FROM facets;
    DELETE FROM tags;
  `);

  // Insert tags
  const insertTag = db.prepare('INSERT INTO tags (tagId, name) VALUES (?, ?)');

  // Genre tags
  insertTag.run('genre-action', 'action');
  insertTag.run('genre-comedy', 'comedy');
  insertTag.run('genre-scifi', 'scifi');
  insertTag.run('genre-horror', 'horror');

  // Aesthetic tags
  insertTag.run('aesthetic-dark', 'dark');
  insertTag.run('aesthetic-light', 'light');
  insertTag.run('aesthetic-epic', 'epic');
  insertTag.run('aesthetic-intimate', 'intimate');

  // Insert facets (combinations that should be valid)
  const insertFacet = db.prepare('INSERT INTO facets (facetId) VALUES (?)');
  insertFacet.run('facet-1'); // action-dark (will have movies)
  insertFacet.run('facet-2'); // comedy-light (will have episodes)
  insertFacet.run('facet-3'); // scifi-dark (will have both movies and episodes)
  insertFacet.run('facet-4'); // action-epic (will have NO media - invalid)
  insertFacet.run('facet-5'); // scifi-epic (will have NO media - invalid)

  // Insert facet-tag relationships
  const insertFacetTag = db.prepare(
    'INSERT INTO facet_tags (facetId, tagId, tagType) VALUES (?, ?, ?)',
  );

  // Facet 1: action-dark (VALID - will have movies)
  insertFacetTag.run('facet-1', 'genre-action', 'genre');
  insertFacetTag.run('facet-1', 'aesthetic-dark', 'aesthetic');

  // Facet 2: comedy-light (VALID - will have episodes)
  insertFacetTag.run('facet-2', 'genre-comedy', 'genre');
  insertFacetTag.run('facet-2', 'aesthetic-light', 'aesthetic');

  // Facet 3: scifi-dark (VALID - will have both)
  insertFacetTag.run('facet-3', 'genre-scifi', 'genre');
  insertFacetTag.run('facet-3', 'aesthetic-dark', 'aesthetic');

  // Facet 4: action-epic (INVALID - no media)
  insertFacetTag.run('facet-4', 'genre-action', 'genre');
  insertFacetTag.run('facet-4', 'aesthetic-epic', 'aesthetic');

  // Facet 5: scifi-epic (INVALID - no media)
  insertFacetTag.run('facet-5', 'genre-scifi', 'genre');
  insertFacetTag.run('facet-5', 'aesthetic-epic', 'aesthetic');

  // Insert movies
  const insertMovie = db.prepare(
    'INSERT INTO movies (title, path, mediaItemId) VALUES (?, ?, ?)',
  );
  insertMovie.run(
    'Dark Action Movie 1',
    '/movies/dark_action_1.mp4',
    'movie-1',
  );
  insertMovie.run(
    'Dark Action Movie 2',
    '/movies/dark_action_2.mp4',
    'movie-2',
  );
  insertMovie.run('Dark Sci-Fi Movie', '/movies/dark_scifi.mp4', 'movie-3');
  insertMovie.run(
    'Orphan Horror Movie',
    '/movies/horror_epic.mp4',
    'movie-orphan',
  ); // No matching facet

  // Insert movie tags
  const insertMediaTag = db.prepare(
    'INSERT INTO media_tags (mediaItemId, tagId) VALUES (?, ?)',
  );

  // Dark Action Movies (matches facet-1: action-dark)
  insertMediaTag.run('movie-1', 'genre-action');
  insertMediaTag.run('movie-1', 'aesthetic-dark');
  insertMediaTag.run('movie-2', 'genre-action');
  insertMediaTag.run('movie-2', 'aesthetic-dark');

  // Dark Sci-Fi Movie (matches facet-3: scifi-dark)
  insertMediaTag.run('movie-3', 'genre-scifi');
  insertMediaTag.run('movie-3', 'aesthetic-dark');

  // Orphan Horror Movie (horror-epic - no matching facet exists)
  insertMediaTag.run('movie-orphan', 'genre-horror');
  insertMediaTag.run('movie-orphan', 'aesthetic-epic');

  // Insert shows
  const insertShow = db.prepare(
    'INSERT INTO shows (id, title, path, mediaItemId) VALUES (?, ?, ?, ?)',
  );
  insertShow.run(1, 'Light Comedy Show', '/shows/comedy_show/', 'show-1');
  insertShow.run(2, 'Dark Sci-Fi Show', '/shows/scifi_show/', 'show-2');
  insertShow.run(3, 'Empty Action Show', '/shows/empty_show/', 'show-empty'); // Show with no episodes

  // Insert episodes
  const insertEpisode = db.prepare(
    'INSERT INTO episodes (showId, season, episode, path, title, mediaItemId) VALUES (?, ?, ?, ?, ?, ?)',
  );

  // Comedy show episodes (matches facet-2: comedy-light)
  insertEpisode.run(
    1,
    'S01',
    'E01',
    '/shows/comedy_show/S01E01.mp4',
    'Pilot',
    'episode-1',
  );
  insertEpisode.run(
    1,
    'S01',
    'E02',
    '/shows/comedy_show/S01E02.mp4',
    'Second Episode',
    'episode-2',
  );

  // Sci-Fi show episodes (matches facet-3: scifi-dark)
  insertEpisode.run(
    2,
    'S01',
    'E01',
    '/shows/scifi_show/S01E01.mp4',
    'First Contact',
    'episode-3',
  );
  insertEpisode.run(
    2,
    'S01',
    'E02',
    '/shows/scifi_show/S01E02.mp4',
    'The Discovery',
    'episode-4',
  );

  // No episodes for show-empty (this tests edge case)

  // Insert episode tags
  const insertEpisodeTag = db.prepare(
    'INSERT INTO episode_tags (mediaItemId, tagId) VALUES (?, ?)',
  );

  // Comedy episodes (matches facet-2: comedy-light)
  insertEpisodeTag.run('episode-1', 'genre-comedy');
  insertEpisodeTag.run('episode-1', 'aesthetic-light');
  insertEpisodeTag.run('episode-2', 'genre-comedy');
  insertEpisodeTag.run('episode-2', 'aesthetic-light');

  // Sci-Fi episodes (matches facet-3: scifi-dark)
  insertEpisodeTag.run('episode-3', 'genre-scifi');
  insertEpisodeTag.run('episode-3', 'aesthetic-dark');
  insertEpisodeTag.run('episode-4', 'genre-scifi');
  insertEpisodeTag.run('episode-4', 'aesthetic-dark');
}
