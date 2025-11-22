"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFacetSystemHandler = exports.calculateTransitionCompatibilityHandler = exports.suggestTransitionsHandler = exports.getFeedbackHistoryHandler = exports.submitFeedbackHandler = exports.findAvailableBridgesHandler = exports.getBridgeByIdHandler = exports.getAllBridgesHandler = exports.createFacetBridgeHandler = exports.getClosestFacetsHandler = exports.getFacetDistanceHandler = exports.setFacetDistanceHandler = exports.deleteFacetHandler = exports.updateFacetHandler = exports.getFacetByIdHandler = exports.getFacetsByTypeHandler = exports.getAllFacetsHandler = exports.createFacetHandler = void 0;
const facetRepository_1 = require("../repositories/facetRepository");
const facet_1 = require("../models/facet");
// =====================
// Facet Management Controllers
// =====================
const createFacetHandler = async (req, res) => {
    try {
        const facet = facet_1.Facet.fromRequestObject(req.body);
        const created = facetRepository_1.facetRepository.create(facet);
        res
            .status(201)
            .json({
            success: true,
            data: created,
            message: 'Facet created successfully',
        });
    }
    catch (error) {
        res
            .status(400)
            .json({
            success: false,
            error: error.message || 'Failed to create facet',
        });
    }
};
exports.createFacetHandler = createFacetHandler;
const getAllFacetsHandler = (req, res) => {
    try {
        const facets = facetRepository_1.facetRepository.findAll();
        res.status(200).json({ success: true, data: facets, count: facets.length });
    }
    catch (error) {
        res
            .status(500)
            .json({
            success: false,
            error: error.message || 'Failed to retrieve facets',
        });
    }
};
exports.getAllFacetsHandler = getAllFacetsHandler;
const getFacetsByTypeHandler = (req, res) => {
    try {
        const { type } = req.params;
        if (type !== 'Genre' && type !== 'Aesthetic') {
            res
                .status(400)
                .json({
                success: false,
                error: 'Invalid facet type. Must be "Genre" or "Aesthetic"',
            });
            return;
        }
        const all = facetRepository_1.facetRepository.findAll();
        const facets = type === 'Genre'
            ? all.filter(f => !!f.genre)
            : all.filter(f => !!f.aesthetic);
        res
            .status(200)
            .json({ success: true, data: facets, count: facets.length, type });
    }
    catch (error) {
        res
            .status(500)
            .json({
            success: false,
            error: error.message || 'Failed to retrieve facets by type',
        });
    }
};
exports.getFacetsByTypeHandler = getFacetsByTypeHandler;
const getFacetByIdHandler = (req, res) => {
    try {
        const { facetId } = req.params;
        const facet = facetRepository_1.facetRepository.findByFacetId(facetId);
        if (!facet) {
            res.status(404).json({ success: false, error: 'Facet not found' });
            return;
        }
        res.status(200).json({ success: true, data: facet });
    }
    catch (error) {
        res
            .status(500)
            .json({
            success: false,
            error: error.message || 'Failed to retrieve facet',
        });
    }
};
exports.getFacetByIdHandler = getFacetByIdHandler;
const updateFacetHandler = (req, res) => {
    try {
        const { facetId } = req.params;
        const facet = facet_1.Facet.fromRequestObject({ ...req.body, facetId });
        const updatedFacet = facetRepository_1.facetRepository.update(facetId, facet);
        if (!updatedFacet) {
            res.status(404).json({ success: false, error: 'Facet not found' });
            return;
        }
        res
            .status(200)
            .json({
            success: true,
            data: updatedFacet,
            message: 'Facet updated successfully',
        });
    }
    catch (error) {
        res
            .status(400)
            .json({
            success: false,
            error: error.message || 'Failed to update facet',
        });
    }
};
exports.updateFacetHandler = updateFacetHandler;
const deleteFacetHandler = (req, res) => {
    try {
        const { facetId } = req.params;
        const deleted = facetRepository_1.facetRepository.delete(facetId);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Facet not found' });
            return;
        }
        res
            .status(200)
            .json({ success: true, message: 'Facet deleted successfully' });
    }
    catch (error) {
        res
            .status(500)
            .json({
            success: false,
            error: error.message || 'Failed to delete facet',
        });
    }
};
exports.deleteFacetHandler = deleteFacetHandler;
// =====================
// Distance Management Controllers
// =====================
const setFacetDistanceHandler = async (req, res) => {
    try {
        const { sourceFacetId, targetFacetId } = req.params;
        const { distance, confidence } = req.body;
        if (typeof distance !== 'number' || distance < 0 || distance > 1) {
            res.status(400).json({
                success: false,
                error: 'Distance must be a number between 0 and 1',
            });
            return;
        }
        facetRepository_1.facetRepository.createDistance(sourceFacetId, targetFacetId, distance);
        res
            .status(200)
            .json({
            success: true,
            data: { sourceFacetId, targetFacetId, distance },
            message: 'Facet distance set successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to set facet distance',
        });
    }
};
exports.setFacetDistanceHandler = setFacetDistanceHandler;
const getFacetDistanceHandler = async (req, res) => {
    try {
        const { sourceFacetId, targetFacetId } = req.params;
        const distance = facetRepository_1.facetRepository.findDistance(sourceFacetId, targetFacetId);
        res
            .status(200)
            .json({
            success: true,
            data: { sourceFacetId, targetFacetId, distance },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get facet distance',
        });
    }
};
exports.getFacetDistanceHandler = getFacetDistanceHandler;
const getClosestFacetsHandler = async (req, res) => {
    try {
        const { facetId } = req.params;
        const { limit } = req.query;
        const limitNum = limit ? parseInt(limit) : 5;
        const closestFacets = facetRepository_1.facetRepository
            .findAllDistancesFrom(facetId)
            .slice(0, limitNum);
        res
            .status(200)
            .json({ success: true, data: { sourceFacetId: facetId, closestFacets } });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get closest facets',
        });
    }
};
exports.getClosestFacetsHandler = getClosestFacetsHandler;
// =====================
// Bridge Management Controllers
// =====================
const createFacetBridgeHandler = async (req, res) => {
    try {
        // Bridges are deprecated in this design. Return 410 Gone to indicate removal.
        res
            .status(410)
            .json({ success: false, error: 'Facet bridges are deprecated' });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create facet bridge',
        });
    }
};
exports.createFacetBridgeHandler = createFacetBridgeHandler;
const getAllBridgesHandler = async (req, res) => {
    try {
        res
            .status(410)
            .json({ success: false, error: 'Facet bridges are deprecated' });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve facet bridges',
        });
    }
};
exports.getAllBridgesHandler = getAllBridgesHandler;
const getBridgeByIdHandler = async (req, res) => {
    try {
        const { bridgeId } = req.params;
        res
            .status(410)
            .json({ success: false, error: 'Facet bridges are deprecated' });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve facet bridge',
        });
    }
};
exports.getBridgeByIdHandler = getBridgeByIdHandler;
const findAvailableBridgesHandler = async (req, res) => {
    try {
        const { facetIds } = req.body;
        if (!Array.isArray(facetIds)) {
            res.status(400).json({
                success: false,
                error: 'facetIds must be an array',
            });
            return;
        }
        res
            .status(410)
            .json({ success: false, error: 'Facet bridges are deprecated' });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to find available bridges',
        });
    }
};
exports.findAvailableBridgesHandler = findAvailableBridgesHandler;
// =====================
// Feedback Controllers
// =====================
const submitFeedbackHandler = async (req, res) => {
    try {
        // Feedback endpoint not implemented yet
        res
            .status(501)
            .json({ success: false, error: 'Feedback endpoint not implemented' });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to submit feedback',
        });
    }
};
exports.submitFeedbackHandler = submitFeedbackHandler;
const getFeedbackHistoryHandler = async (req, res) => {
    try {
        const { sourceFacetId, targetFacetId } = req.query;
        // Feedback history not implemented
        res
            .status(501)
            .json({
            success: false,
            error: 'Feedback history endpoint not implemented',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get feedback history',
        });
    }
};
exports.getFeedbackHistoryHandler = getFeedbackHistoryHandler;
// =====================
// Intelligent Transition Controllers
// =====================
const suggestTransitionsHandler = async (req, res) => {
    try {
        const { currentFacetIds, availableTargetFacets, maxSuggestions } = req.body;
        if (!Array.isArray(currentFacetIds)) {
            res.status(400).json({
                success: false,
                error: 'currentFacetIds must be an array',
            });
            return;
        }
        // Transition suggestion algorithm not implemented yet
        res
            .status(501)
            .json({
            success: false,
            error: 'Transition suggestion endpoint not implemented',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to suggest transitions',
        });
    }
};
exports.suggestTransitionsHandler = suggestTransitionsHandler;
const calculateTransitionCompatibilityHandler = async (req, res) => {
    try {
        const { fromFacetIds, toFacetIds } = req.body;
        if (!Array.isArray(fromFacetIds) || !Array.isArray(toFacetIds)) {
            res.status(400).json({
                success: false,
                error: 'Both fromFacetIds and toFacetIds must be arrays',
            });
            return;
        }
        // Compatibility calculation not implemented yet
        res
            .status(501)
            .json({
            success: false,
            error: 'Compatibility calculation endpoint not implemented',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to calculate transition compatibility',
        });
    }
};
exports.calculateTransitionCompatibilityHandler = calculateTransitionCompatibilityHandler;
// =====================
// System Controllers
// =====================
const initializeFacetSystemHandler = async (req, res) => {
    try {
        // Initialize is a no-op for now (tables already created). Return success.
        res
            .status(200)
            .json({ success: true, message: 'Facet system initialized (no-op)' });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to initialize facet system',
        });
    }
};
exports.initializeFacetSystemHandler = initializeFacetSystemHandler;
