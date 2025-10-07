import { Router } from 'express';
import * as streamCont from '../controllers/streamControllers';

const router = Router();

// ===========================================
//              STREAM CONTROL
// ===========================================

// Start Stream with the intention of playing continuously with no end time until stopped manually
router.post(
  '/continuous-stream',
  streamCont.contStreamValidationRules,
  streamCont.continuousStreamHandler,
);

// Get current stream status
router.get('/status', streamCont.streamStatusHandler);

// Stop current continuous stream
router.post('/stop', streamCont.stopStreamHandler);

export default router;
