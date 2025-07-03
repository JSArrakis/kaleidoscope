import { Router } from 'express';
import * as showCont from '../controllers/showControllers';
import * as movCont from '../controllers/movieControllers';
import * as commCont from '../controllers/commercialControllers';
import * as shortCont from '../controllers/shortControllers';
import * as musicCont from '../controllers/musicControllers';
import * as promoCont from '../controllers/promoControllers';
import * as bumperCont from '../controllers/bumperControllers';
import * as collectionCont from '../controllers/collectionControllers';
import * as tagCont from '../controllers/tagControllers';
import * as musicGenreCont from '../controllers/musicGenreControllers';
// import * as blockCont from '../controllers/blockControllers';
import * as verify from '../middleware/validationMiddleware';

const router = Router();

// ===========================================
//            DATABASE MANAGEMENT
// ===========================================

// Show Management
router.post(
  '/create-show',
  verify.createShowValidationRules,
  showCont.createShowHandler,
);
router.delete(
  '/delete-show',
  verify.deleteShowValidationRules,
  showCont.deleteShowHandler,
);
router.put(
  '/update-show',
  verify.updateShowValidationRules,
  showCont.updateShowHandler,
);
router.get('/get-show', verify.getShowValidationRules, showCont.getShowHandler);
router.get(
  '/get-all-show-data',
  verify.getShowValidationRules,
  showCont.getAllShowsDataHandler,
);
router.get(
  '/get-all-shows',
  verify.getShowValidationRules,
  showCont.getAllShowsHandler,
);

// Movie Management
router.post(
  '/create-movie',
  verify.createMovieValidationRules,
  movCont.createMovieHandler,
);
router.post(
  '/bulk-create-movies',
  verify.bulkCreateMoviesValidationRules,
  movCont.bulkCreateMovieHandler,
);
router.delete(
  '/delete-movie',
  verify.deleteMovieValidationRules,
  movCont.deleteMovieHandler,
);
router.put(
  '/update-movie',
  verify.updateMovieValidationRules,
  movCont.updateMovieHandler,
);
router.get(
  '/get-movie',
  verify.getMovieValidationRules,
  movCont.getMovieHandler,
);
router.get(
  '/get-all-movies',
  verify.getMovieValidationRules,
  movCont.getAllMoviesHandler,
);

// Commercial Management
router.post(
  '/create-commercial',
  verify.createBufferValidationRules,
  commCont.createCommercialHandler,
);
router.post(
  '/bulk-create-commercials',
  verify.bulkCreateBufferValidationRules,
  commCont.bulkCreateCommercialHandler,
);
router.delete(
  '/delete-commercial',
  verify.deleteBufferValidationRules,
  commCont.deleteCommercialHandler,
);
router.put(
  '/update-commercial',
  verify.updateBufferValidationRules,
  commCont.updateCommercialHandler,
);
router.get(
  '/get-commercial',
  verify.getBufferValidationRules,
  commCont.getCommercialHandler,
);
router.get(
  '/get-all-commercials',
  verify.getBufferValidationRules,
  commCont.getAllCommercialsHandler,
);

// Short Management
router.post(
  '/create-short',
  verify.createBufferValidationRules,
  shortCont.createShortHandler,
);
router.post(
  '/bulk-create-shorts',
  verify.bulkCreateBufferValidationRules,
  shortCont.bulkCreateShortHandler,
);
router.delete(
  '/delete-short',
  verify.deleteBufferValidationRules,
  shortCont.deleteShortHandler,
);
router.put(
  '/update-short',
  verify.updateBufferValidationRules,
  shortCont.updateShortHandler,
);
router.get(
  '/get-short',
  verify.getBufferValidationRules,
  shortCont.getShortHandler,
);
router.get(
  '/get-all-shorts',
  verify.getBufferValidationRules,
  shortCont.getAllShortsHandler,
);

// Music Management
router.post(
  '/create-music',
  verify.createBufferValidationRules,
  musicCont.createMusicHandler,
);
router.post(
  '/bulk-create-music',
  verify.bulkCreateBufferValidationRules,
  musicCont.bulkCreateMusicHandler,
);
router.delete(
  '/delete-music',
  verify.deleteBufferValidationRules,
  musicCont.deleteMusicHandler,
);
router.put(
  '/update-music',
  verify.updateBufferValidationRules,
  musicCont.updateMusicHandler,
);
router.get(
  '/get-music',
  verify.getBufferValidationRules,
  musicCont.getMusicHandler,
);
router.get(
  '/get-all-music',
  verify.getBufferValidationRules,
  musicCont.getAllMusicHandler,
);

// Promo Management
router.post(
  '/create-promo',
  verify.createBufferValidationRules,
  promoCont.createPromoHandler,
);
router.post(
  '/bulk-create-promos',
  verify.bulkCreateBufferValidationRules,
  promoCont.bulkCreatePromoHandler,
);
router.delete(
  '/delete-promo',
  verify.deleteBufferValidationRules,
  promoCont.deletePromoHandler,
);
router.put(
  '/update-promo',
  verify.updateBufferValidationRules,
  promoCont.updatePromoHandler,
);
router.get(
  '/get-promo',
  verify.getBufferValidationRules,
  promoCont.getPromoHandler,
);
router.get(
  '/get-all-promos',
  verify.getBufferValidationRules,
  promoCont.getAllPromosHandler,
);

// Bumper Management
router.post(
  '/create-bumper',
  verify.createBufferValidationRules,
  bumperCont.createBumperHandler,
);
router.delete(
  '/delete-bumper',
  verify.deleteBufferValidationRules,
  bumperCont.deleteBumperHandler,
);
router.put(
  '/update-bumper',
  verify.updateBufferValidationRules,
  bumperCont.updateBumperHandler,
);
router.get(
  '/get-all-bumpers',
  verify.getBufferValidationRules,
  bumperCont.getAllBumpersHandler,
);

// Tag Management
router.post(
  '/create-aesthetic-tag',
  verify.createTagValidationRules,
  tagCont.createAestheticTagHandler,
);

router.delete(
  '/delete-aesthetic-tag',
  verify.deleteTagValidationRules,
  tagCont.deleteAestheticTagHandler,
);

router.get(
  '/get-all-aesthetic-tags',
  verify.getTagsValidationRules,
  tagCont.getAllAestheticTagsHandler,
);

router.post(
  '/create-age-group',
  verify.createAgeGroupValidationRules,
  tagCont.createAgeGroupHandler,
);

router.delete(
  '/delete-age-group',
  verify.deleteAgeGroupValidationRules,
  tagCont.deleteAgeGroupHandler,
);

router.put(
  '/update-age-group',
  verify.updateAgeGroupValidationRules,
  tagCont.updateAgeGroupHandler,
);

router.get(
  '/get-all-age-groups',
  verify.getAgeGroupsValidationRules,
  tagCont.getAllAgeGroupsHandler,
);

router.post(
  '/create-era-tag',
  verify.createTagValidationRules,
  tagCont.createEraTagHandler,
);

router.delete(
  '/delete-era-tag',
  verify.deleteTagValidationRules,
  tagCont.deleteEraTagHandler,
);

router.get(
  '/get-all-era-tags',
  verify.getTagsValidationRules,
  tagCont.getAllEraTagsHandler,
);

router.post(
  '/create-holiday-tag',
  verify.createTagValidationRules,
  tagCont.createHolidayTagHandler,
);

router.delete(
  '/delete-holiday-tag',
  verify.deleteTagValidationRules,
  tagCont.deleteHolidayTagHandler,
);

router.get(
  '/get-all-holiday-tags',
  verify.getTagsValidationRules,
  tagCont.getAllHolidayTagsHandler,
);

router.post(
  '/create-genre-tag',
  verify.createTagValidationRules,
  tagCont.createGenreTagHandler,
);

router.delete(
  '/delete-genre-tag',
  verify.deleteTagValidationRules,
  tagCont.deleteGenreTagHandler,
);

router.get(
  '/get-all-genre-tags',
  verify.getTagsValidationRules,
  tagCont.getAllGenreTagsHandler,
);

router.post(
  '/create-specialty-tag',
  verify.createTagValidationRules,
  tagCont.createSpecialtyTagHandler,
);

router.delete(
  '/delete-specialty-tag',
  verify.deleteTagValidationRules,
  tagCont.deleteSpecialtyTagHandler,
);

router.get(
  '/get-all-specialty-tags',
  verify.getTagsValidationRules,
  tagCont.getAllSpecialtyTagsHandler,
);

router.post(
  '/create-music-genre',
  verify.createTagValidationRules,
  musicGenreCont.createMusicGenreHandler,
);

router.delete(
  '/delete-music-genre',
  verify.deleteTagValidationRules,
  musicGenreCont.deleteMusicGenreHandler,
);

router.get(
  '/get-all-music-genres',
  verify.getTagsValidationRules,
  musicGenreCont.getAllMusicGenresHandler,
);

// Collection Management
router.post(
  '/create-collection',
  verify.createCollectionValidationRules,
  collectionCont.createCollectionHandler,
);

router.delete(
  '/delete-collection',
  verify.deleteCollectionValidationRules,
  collectionCont.deleteCollectionHandler,
);

router.put(
  '/update-collection',
  verify.updateCollectionValidationRules,
  collectionCont.updateCollectionHandler,
);

router.get(
  '/get-collection',
  verify.getCollectionValidationRules,
  collectionCont.getCollectionHandler,
);

router.get(
  '/get-all-collections',
  verify.getCollectionValidationRules,
  collectionCont.getAllCollectionsHandler,
);

// Block Management
// router.post(
//   '/create-block',
//   verify.createBlockValidationRules,
//   blockCont.createBlockHandler,
// );

export default router;
