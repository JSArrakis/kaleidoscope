export interface IMosaic {
  mosaicId: string;
  facetId: string; // Reference to the facet this mosaic is associated with
  musicalGenres: string[]; // List of musical genre names that this mosaic supports
  name?: string; // Optional descriptive name for the mosaic
  description?: string; // Optional description of the mosaic's purpose
}

export class Mosaic implements IMosaic {
  public mosaicId: string;
  public facetId: string;
  public musicalGenres: string[];
  public name?: string;
  public description?: string;

  constructor(
    mosaicId: string,
    facetId: string,
    musicalGenres: string[],
    name?: string,
    description?: string,
  ) {
    this.mosaicId = mosaicId;
    this.facetId = facetId;
    this.musicalGenres = musicalGenres;
    this.name = name;
    this.description = description;
  }

  // Helper method to check if this mosaic contains a specific musical genre
  public hasMusicalGenre(genreName: string): boolean {
    return this.musicalGenres.includes(genreName);
  }

  // Convert from database object
  public static fromDatabaseObject(dbObj: any): Mosaic {
    return new Mosaic(
      dbObj.mosaicId,
      dbObj.facetId,
      JSON.parse(dbObj.musicalGenres || '[]'), // Parse JSON array from database
      dbObj.name,
      dbObj.description,
    );
  }

  // Convert to database object
  public toDatabaseObject(): any {
    return {
      mosaicId: this.mosaicId,
      facetId: this.facetId,
      musicalGenres: JSON.stringify(this.musicalGenres), // Store as JSON string
      name: this.name,
      description: this.description,
    };
  }
}

// Interface for mosaic selection options
export interface MosaicSelectionOptions {
  maxCandidates?: number; // Maximum number of mosaics to consider
  preferredGenres?: string[]; // Preferred musical genres to bias selection toward
  excludeGenres?: string[]; // Musical genres to exclude
  requireAllGenres?: boolean; // Whether selected mosaic must contain ALL preferred genres
}

// Result of mosaic selection with reasoning
export interface MosaicSelectionResult {
  mosaic: Mosaic | null;
  selectedGenres: string[]; // Which musical genres were ultimately selected
  selectionReason: string; // Why this mosaic was chosen
  candidateCount: number; // How many mosaics were considered
}
