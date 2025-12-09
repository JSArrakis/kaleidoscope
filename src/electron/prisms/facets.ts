/**
 * Finds media matching a specific facet (genre/aesthetic combination)
 */
export function findMediaWithFacet(facet: {
  genre: Tag;
  aesthetic: Tag;
}): Movie | Show | null {
  // Find movies with both tags
  const moviesWithGenre = movieRepository.findByTag(facet.genre.tagId);
  const moviesWithBoth = moviesWithGenre.filter((movie: Movie) =>
    movie.tags.some((tag: Tag) => tag.tagId === facet.aesthetic.tagId)
  );

  if (moviesWithBoth.length > 0) {
    return moviesWithBoth[Math.floor(Math.random() * moviesWithBoth.length)];
  }

  // Find shows with both tags
  const showsWithGenre = showRepository.findByTag(facet.genre.tagId);
  const showsWithBoth = showsWithGenre.filter((show: Show) =>
    show.tags.some((tag: Tag) => tag.tagId === facet.aesthetic.tagId)
  );

  if (showsWithBoth.length > 0) {
    return showsWithBoth[Math.floor(Math.random() * showsWithBoth.length)];
  }

  return null;
}
