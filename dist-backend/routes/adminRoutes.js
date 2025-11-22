"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const showCont = __importStar(require("../controllers/showControllers"));
const movCont = __importStar(require("../controllers/movieControllers"));
const commCont = __importStar(require("../controllers/commercialControllers"));
const shortCont = __importStar(require("../controllers/shortControllers"));
const musicCont = __importStar(require("../controllers/musicControllers"));
const promoCont = __importStar(require("../controllers/promoControllers"));
const bumperCont = __importStar(require("../controllers/bumperControllers"));
const collectionCont = __importStar(require("../controllers/collectionControllers"));
const tagCont = __importStar(require("../controllers/tagControllers"));
// import * as blockCont from '../controllers/blockControllers';
const statusCont = __importStar(require("../controllers/statusControllers"));
const facetCont = __importStar(require("../controllers/facetControllers"));
const verify = __importStar(require("../middleware/validationMiddleware"));
const router = (0, express_1.Router)();
// Show Management
router.post('/create-show', verify.createShowValidationRules, showCont.createShowHandler);
router.delete('/delete-show', verify.deleteShowValidationRules, showCont.deleteShowHandler);
router.put('/update-show', verify.updateShowValidationRules, showCont.updateShowHandler);
router.get('/get-show', verify.getShowValidationRules, showCont.getShowHandler);
router.get('/get-all-shows', verify.getShowValidationRules, showCont.getAllShowsHandler);
// Movie Management
router.post('/create-movie', verify.createMovieValidationRules, movCont.createMovieHandler);
router.delete('/delete-movie', verify.deleteMovieValidationRules, movCont.deleteMovieHandler);
router.put('/update-movie', verify.updateMovieValidationRules, movCont.updateMovieHandler);
router.get('/get-movie', verify.getMovieValidationRules, movCont.getMovieHandler);
router.get('/get-all-movies', verify.getMovieValidationRules, movCont.getAllMoviesHandler);
// Commercial Management
router.post('/create-commercial', verify.createBufferValidationRules, commCont.createCommercialHandler);
router.delete('/delete-commercial', verify.deleteBufferValidationRules, commCont.deleteCommercialHandler);
router.put('/update-commercial', verify.updateBufferValidationRules, commCont.updateCommercialHandler);
router.get('/get-commercial', verify.getBufferValidationRules, commCont.getCommercialHandler);
router.get('/get-all-commercials', verify.getBufferValidationRules, commCont.getAllCommercialsHandler);
// Short Management
router.post('/create-short', verify.createBufferValidationRules, shortCont.createShortHandler);
router.delete('/delete-short', verify.deleteBufferValidationRules, shortCont.deleteShortHandler);
router.put('/update-short', verify.updateBufferValidationRules, shortCont.updateShortHandler);
router.get('/get-short', verify.getBufferValidationRules, shortCont.getShortHandler);
router.get('/get-all-shorts', verify.getBufferValidationRules, shortCont.getAllShortsHandler);
// Music Management
router.post('/create-music', verify.createMusicValidationRules, musicCont.createMusicHandler);
router.delete('/delete-music', verify.deleteMusicValidationRules, musicCont.deleteMusicHandler);
router.put('/update-music', verify.updateMusicValidationRules, musicCont.updateMusicHandler);
router.get('/get-music', verify.getMusicValidationRules, musicCont.getMusicHandler);
router.get('/get-all-music', verify.getMusicValidationRules, musicCont.getAllMusicHandler);
// Promo Management
router.post('/create-promo', verify.createPromoValidationRules, promoCont.createPromoHandler);
router.delete('/delete-promo', verify.deletePromoValidationRules, promoCont.deletePromoHandler);
router.put('/update-promo', verify.updatePromoValidationRules, promoCont.updatePromoHandler);
router.get('/get-promo', verify.getPromoValidationRules, promoCont.getPromoHandler);
router.get('/get-all-promos', verify.getPromoValidationRules, promoCont.getAllPromosHandler);
// Bumper Management
router.post('/create-bumper', verify.createBumperValidationRules, bumperCont.createBumperHandler);
router.delete('/delete-bumper', verify.deleteBumperValidationRules, bumperCont.deleteBumperHandler);
router.put('/update-bumper', verify.updateBumperValidationRules, bumperCont.updateBumperHandler);
router.get('/get-all-bumpers', verify.getBumperValidationRules, bumperCont.getAllBumpersHandler);
router.get('/get-bumper', verify.getBumperValidationRules, bumperCont.getBumperHandler);
// Tag Management
router.post('/create-tag', verify.createTagValidationRules, tagCont.createTagHandler);
router.delete('/delete-tag', verify.deleteTagValidationRules, tagCont.deleteTagHandler);
router.get('/get-all-tags', verify.getTagsValidationRules, tagCont.getAllTagsHandler);
router.get('/get-tag', verify.getTagsValidationRules, tagCont.getTagHandler);
router.get('/get-all-tags-by-type', verify.getTagsValidationRules, tagCont.getAllTagsByTypeHandler);
// Collection Management
router.post('/create-collection', verify.createCollectionValidationRules, collectionCont.createCollectionHandler);
router.delete('/delete-collection', verify.deleteCollectionValidationRules, collectionCont.deleteCollectionHandler);
router.put('/update-collection', verify.updateCollectionValidationRules, collectionCont.updateCollectionHandler);
router.get('/get-collection', verify.getCollectionValidationRules, collectionCont.getCollectionHandler);
router.get('/get-all-collections', verify.getCollectionValidationRules, collectionCont.getAllCollectionsHandler);
// Block Management
// router.post(
//   '/create-block',
//   verify.createBlockValidationRules,
//   blockCont.createBlockHandler,
// );
// =====================
// Facets System Management
// =====================
// Facet Management
router.post('/facets', facetCont.createFacetHandler);
router.get('/facets', facetCont.getAllFacetsHandler);
router.get('/facets/type/:type', facetCont.getFacetsByTypeHandler);
router.get('/facets/:facetId', facetCont.getFacetByIdHandler);
router.put('/facets/:facetId', facetCont.updateFacetHandler);
router.delete('/facets/:facetId', facetCont.deleteFacetHandler);
// =====================
// Facets System Routes (Ordered: Specific routes before parameterized)
// =====================
// System Initialization
router.post('/facets/initialize', facetCont.initializeFacetSystemHandler);
// Intelligent Transitions
router.post('/facets/suggest-transitions', facetCont.suggestTransitionsHandler);
router.post('/facets/calculate-compatibility', facetCont.calculateTransitionCompatibilityHandler);
// Feedback & Learning
router.post('/facets/feedback', facetCont.submitFeedbackHandler);
router.get('/facets/feedback', facetCont.getFeedbackHistoryHandler);
// Bridge Management (dedicated endpoints to avoid routing conflicts)
router.post('/facet-bridges', facetCont.createFacetBridgeHandler);
router.get('/facet-bridges', facetCont.getAllBridgesHandler);
router.post('/facet-bridges/find', facetCont.findAvailableBridgesHandler);
router.get('/facet-bridges/:bridgeId', facetCont.getBridgeByIdHandler);
// Facet Type Routes (specific)
router.get('/facets/type/:type', facetCont.getFacetsByTypeHandler);
// Core Facet Management
router.post('/facets', facetCont.createFacetHandler);
router.get('/facets', facetCont.getAllFacetsHandler);
// Distance Management (parameterized - order matters)
router.put('/facets/:sourceFacetId/distance/:targetFacetId', facetCont.setFacetDistanceHandler);
router.get('/facets/:sourceFacetId/distance/:targetFacetId', facetCont.getFacetDistanceHandler);
router.get('/facets/:facetId/closest', facetCont.getClosestFacetsHandler);
// Individual Facet Routes (most generic - should be last)
router.get('/facets/:facetId', facetCont.getFacetByIdHandler);
router.put('/facets/:facetId', facetCont.updateFacetHandler);
router.delete('/facets/:facetId', facetCont.deleteFacetHandler);
// System Initialization
router.post('/facets/initialize', facetCont.initializeFacetSystemHandler);
// System Status and Health Check
router.get('/status', statusCont.systemStatusHandler);
router.get('/health', statusCont.quickHealthHandler);
router.post('/test-create-tag', statusCont.testCreateTagHandler);
router.post('/reset-database', statusCont.resetDatabaseHandler);
// Streaming Service Status Endpoints
router.get('/streaming-status', statusCont.streamingStatusHandler);
router.get('/current-media', statusCont.currentMediaHandler);
router.get('/stream-queue', statusCont.streamQueueHandler);
router.get('/timing-status', statusCont.timingStatusHandler);
router.get('/vlc-status', statusCont.vlcStatusHandler);
exports.default = router;
