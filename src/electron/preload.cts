const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  openFileDialogHandler: async () => await ipcInvoke("openFileDialog"),
  getCollectionsHandler: async () => await ipcInvoke("getCollections"),
  createCollectionHandler: async (collection: PrismCurationObj) =>
    await ipcInvoke("createCollection", collection),
  deleteCollectionHandler: async (collection: PrismCurationObj) =>
    await ipcInvoke("deleteCollection", collection),
  updateCollectionHandler: async (collection: PrismCurationObj) =>
    await ipcInvoke("updateCollection", collection),
  getMoviesHandler: async () => await ipcInvoke("getMovies"),
  createMovieHandler: async (movie: Movie) =>
    await ipcInvoke("createMovie", movie),
  deleteMovieHandler: async (movie: Movie) =>
    await ipcInvoke("deleteMovie", movie),
  updateMovieHandler: async (movie: Movie) =>
    await ipcInvoke("updateMovie", movie),
  getShowsHandler: async () => await ipcInvoke("getShows"),
  createShowHandler: async (show: Show) => await ipcInvoke("createShow", show),
  deleteShowHandler: async (show: Show) => await ipcInvoke("deleteShow", show),
  updateShowHandler: async (show: Show) => await ipcInvoke("updateShow", show),
  getShortsHandler: async () => await ipcInvoke("getShorts"),
  createShortHandler: async (short: Short) =>
    await ipcInvoke("createShort", short),
  deleteShortHandler: async (short: Short) =>
    await ipcInvoke("deleteShort", short),
  updateShortHandler: async (short: Short) =>
    await ipcInvoke("updateShort", short),
  getMusicHandler: async () => await ipcInvoke("getMusic"),
  createMusicHandler: async (music: Music) =>
    await ipcInvoke("createMusic", music),
  deleteMusicHandler: async (music: Music) =>
    await ipcInvoke("deleteMusic", music),
  updateMusicHandler: async (music: Music) =>
    await ipcInvoke("updateMusic", music),
  getCommercialsHandler: async () => await ipcInvoke("getCommercials"),
  createCommercialHandler: async (commercial: Commercial) =>
    await ipcInvoke("createCommercial", commercial),
  deleteCommercialHandler: async (commercial: Commercial) =>
    await ipcInvoke("deleteCommercial", commercial),
  updateCommercialHandler: async (commercial: Commercial) =>
    await ipcInvoke("updateCommercial", commercial),
  getPromosHandler: async () => await ipcInvoke("getPromos"),
  createPromoHandler: async (promo: Promo) =>
    await ipcInvoke("createPromo", promo),
  deletePromoHandler: async (promo: Promo) =>
    await ipcInvoke("deletePromo", promo),
  updatePromoHandler: async (promo: Promo) =>
    await ipcInvoke("updatePromo", promo),
  getBumpersHandler: async () => await ipcInvoke("getBumpers"),
  createBumperHandler: async (bumper: Bumper) =>
    await ipcInvoke("createBumper", bumper),
  deleteBumperHandler: async (bumper: Bumper) =>
    await ipcInvoke("deleteBumper", bumper),
  updateBumperHandler: async (bumper: Bumper) =>
    await ipcInvoke("updateBumper", bumper),
  getAestheticTagsHandler: async () => await ipcInvoke("getAestheticTags"),
  createAestheticTagHandler: async (tag: Tag) =>
    await ipcInvoke("createAestheticTag", tag),
  deleteAestheticTagHandler: async (tag: Tag) =>
    await ipcInvoke("deleteAestheticTag", tag),
  getEraTagsHandler: async () => await ipcInvoke("getEraTags"),
  createEraTagHandler: async (tag: Tag) => await ipcInvoke("createEraTag", tag),
  deleteEraTagHandler: async (tag: Tag) => await ipcInvoke("deleteEraTag", tag),
  getGenreTagsHandler: async () => await ipcInvoke("getGenreTags"),
  createGenreTagHandler: async (tag: Tag) =>
    await ipcInvoke("createGenreTag", tag),
  deleteGenreTagHandler: async (tag: Tag) =>
    await ipcInvoke("deleteGenreTag", tag),
  getSpecialtyTagsHandler: async () => await ipcInvoke("getSpecialtyTags"),
  createSpecialtyTagHandler: async (tag: Tag) =>
    await ipcInvoke("createSpecialtyTag", tag),
  deleteSpecialtyTagHandler: async (tag: Tag) =>
    await ipcInvoke("deleteSpecialtyTag", tag),
  getAgeGroupsHandler: async () => await ipcInvoke("getAgeGroups"),
  createAgeGroupHandler: async (tag: Tag) =>
    await ipcInvoke("createAgeGroup", tag),
  deleteAgeGroupHandler: async (tag: Tag) =>
    await ipcInvoke("deleteAgeGroup", tag),
  updateAgeGroupHandler: async (tag: Tag) =>
    await ipcInvoke("updateAgeGroup", tag),
  getHolidaysHandler: async () => await ipcInvoke("getHolidays"),
  createHolidayHandler: async (tag: Tag) =>
    await ipcInvoke("createHoliday", tag),
  deleteHolidayHandler: async (tag: Tag) =>
    await ipcInvoke("deleteHoliday", tag),
  updateHolidayHandler: async (tag: Tag) =>
    await ipcInvoke("updateHoliday", tag),
  getMusicGenresHandler: async () => await ipcInvoke("getMusicGenres"),
  createMusicGenreHandler: async (tag: Tag) =>
    await ipcInvoke("createMusicGenre", tag),
  deleteMusicGenreHandler: async (tag: Tag) =>
    await ipcInvoke("deleteMusicGenre", tag),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  ...args: any[]
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, ...args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  electron.ipcRenderer.on(key, (_: any, payload: EventPayloadMapping[Key]) =>
    callback(payload)
  );
}
