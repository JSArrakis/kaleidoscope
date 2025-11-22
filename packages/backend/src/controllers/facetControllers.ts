import { Request, Response } from 'express';
import { facetRepository } from '../repositories/facetRepository';
import { Facet } from '../models/facet';

// =====================
// Facet Management Controllers
// =====================

export const createFacetHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const facet = Facet.fromRequestObject(req.body);
    const created = facetRepository.create(facet);
    res
      .status(201)
      .json({
        success: true,
        data: created,
        message: 'Facet created successfully',
      });
  } catch (error: any) {
    res
      .status(400)
      .json({
        success: false,
        error: error.message || 'Failed to create facet',
      });
  }
};

export const getAllFacetsHandler = (req: Request, res: Response): void => {
  try {
    const facets = facetRepository.findAll();
    res.status(200).json({ success: true, data: facets, count: facets.length });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || 'Failed to retrieve facets',
      });
  }
};

export const getFacetsByTypeHandler = (req: Request, res: Response): void => {
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

    const all = facetRepository.findAll();
    const facets =
      type === 'Genre'
        ? all.filter(f => !!f.genre)
        : all.filter(f => !!f.aesthetic);
    res
      .status(200)
      .json({ success: true, data: facets, count: facets.length, type });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || 'Failed to retrieve facets by type',
      });
  }
};

export const getFacetByIdHandler = (req: Request, res: Response): void => {
  try {
    const { facetId } = req.params;
    const facet = facetRepository.findByFacetId(facetId);

    if (!facet) {
      res.status(404).json({ success: false, error: 'Facet not found' });
      return;
    }

    res.status(200).json({ success: true, data: facet });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || 'Failed to retrieve facet',
      });
  }
};

export const updateFacetHandler = (req: Request, res: Response): void => {
  try {
    const { facetId } = req.params;
    const facet = Facet.fromRequestObject({ ...req.body, facetId });
    const updatedFacet = facetRepository.update(facetId, facet);

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
  } catch (error: any) {
    res
      .status(400)
      .json({
        success: false,
        error: error.message || 'Failed to update facet',
      });
  }
};

export const deleteFacetHandler = (req: Request, res: Response): void => {
  try {
    const { facetId } = req.params;
    const deleted = facetRepository.delete(facetId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Facet not found' });
      return;
    }

    res
      .status(200)
      .json({ success: true, message: 'Facet deleted successfully' });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || 'Failed to delete facet',
      });
  }
};

// =====================
// Distance Management Controllers
// =====================

export const setFacetDistanceHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

    facetRepository.createDistance(sourceFacetId, targetFacetId, distance);

    res
      .status(200)
      .json({
        success: true,
        data: { sourceFacetId, targetFacetId, distance },
        message: 'Facet distance set successfully',
      });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to set facet distance',
    });
  }
};

export const getFacetDistanceHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { sourceFacetId, targetFacetId } = req.params;
    const distance = facetRepository.findDistance(sourceFacetId, targetFacetId);

    res
      .status(200)
      .json({
        success: true,
        data: { sourceFacetId, targetFacetId, distance },
      });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get facet distance',
    });
  }
};

export const getClosestFacetsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { facetId } = req.params;
    const { limit } = req.query;

    const limitNum = limit ? parseInt(limit as string) : 5;
    const closestFacets = facetRepository
      .findAllDistancesFrom(facetId)
      .slice(0, limitNum);

    res
      .status(200)
      .json({ success: true, data: { sourceFacetId: facetId, closestFacets } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get closest facets',
    });
  }
};

// =====================
// Bridge Management Controllers
// =====================

export const createFacetBridgeHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Bridges are deprecated in this design. Return 410 Gone to indicate removal.
    res
      .status(410)
      .json({ success: false, error: 'Facet bridges are deprecated' });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create facet bridge',
    });
  }
};

export const getAllBridgesHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    res
      .status(410)
      .json({ success: false, error: 'Facet bridges are deprecated' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve facet bridges',
    });
  }
};

export const getBridgeByIdHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { bridgeId } = req.params;
    res
      .status(410)
      .json({ success: false, error: 'Facet bridges are deprecated' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve facet bridge',
    });
  }
};

export const findAvailableBridgesHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to find available bridges',
    });
  }
};

// =====================
// Feedback Controllers
// =====================

export const submitFeedbackHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Feedback endpoint not implemented yet
    res
      .status(501)
      .json({ success: false, error: 'Feedback endpoint not implemented' });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to submit feedback',
    });
  }
};

export const getFeedbackHistoryHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { sourceFacetId, targetFacetId } = req.query;

    // Feedback history not implemented
    res
      .status(501)
      .json({
        success: false,
        error: 'Feedback history endpoint not implemented',
      });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get feedback history',
    });
  }
};

// =====================
// Intelligent Transition Controllers
// =====================

export const suggestTransitionsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to suggest transitions',
    });
  }
};

export const calculateTransitionCompatibilityHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate transition compatibility',
    });
  }
};

// =====================
// System Controllers
// =====================

export const initializeFacetSystemHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Initialize is a no-op for now (tables already created). Return success.
    res
      .status(200)
      .json({ success: true, message: 'Facet system initialized (no-op)' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize facet system',
    });
  }
};
