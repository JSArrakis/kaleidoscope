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
// import * as blockCont from '../controllers/blockControllers';
import * as verify from '../middleware/validationMiddleware';

const router = Router();

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
  verify.createMusicValidationRules,
  musicCont.createMusicHandler,
);
router.delete(
  '/delete-music',
  verify.deleteMusicValidationRules,
  musicCont.deleteMusicHandler,
);
router.put(
  '/update-music',
  verify.updateMusicValidationRules,
  musicCont.updateMusicHandler,
);
router.get(
  '/get-music',
  verify.getMusicValidationRules,
  musicCont.getMusicHandler,
);
router.get(
  '/get-all-music',
  verify.getMusicValidationRules,
  musicCont.getAllMusicHandler,
);

// Promo Management
router.post(
  '/create-promo',
  verify.createPromoValidationRules,
  promoCont.createPromoHandler,
);
router.delete(
  '/delete-promo',
  verify.deletePromoValidationRules,
  promoCont.deletePromoHandler,
);
router.put(
  '/update-promo',
  verify.updatePromoValidationRules,
  promoCont.updatePromoHandler,
);
router.get(
  '/get-promo',
  verify.getPromoValidationRules,
  promoCont.getPromoHandler,
);
router.get(
  '/get-all-promos',
  verify.getPromoValidationRules,
  promoCont.getAllPromosHandler,
);

// Bumper Management
router.post(
  '/create-bumper',
  verify.createBumperValidationRules,
  bumperCont.createBumperHandler,
);
router.delete(
  '/delete-bumper',
  verify.deleteBumperValidationRules,
  bumperCont.deleteBumperHandler,
);
router.put(
  '/update-bumper',
  verify.updateBumperValidationRules,
  bumperCont.updateBumperHandler,
);
router.get(
  '/get-all-bumpers',
  verify.getBumperValidationRules,
  bumperCont.getAllBumpersHandler,
);
router.get(
  '/get-bumper',
  verify.getBumperValidationRules,
  bumperCont.getBumperHandler,
);

// Tag Management
router.post(
  '/create-tag',
  verify.createTagValidationRules,
  tagCont.createTagHandler,
);

router.delete(
  '/delete-tag',
  verify.deleteTagValidationRules,
  tagCont.deleteTagHandler,
);

router.get(
  '/get-all-tags',
  verify.getTagsValidationRules,
  tagCont.getAllTagsHandler,
);

router.get('/get-tag', verify.getTagsValidationRules, tagCont.getTagHandler);

router.get(
  '/get-all-tags-by-type',
  verify.getTagsValidationRules,
  tagCont.getAllTagsByTypeHandler,
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
