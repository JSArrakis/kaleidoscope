import {
  streamStatusHandler,
  stopStreamHandler,
} from '../../src/controllers/streamControllers';

// Mock services
jest.mock('../../src/services/streamManager', () => ({
  getStreamStatus: jest.fn(() => ({
    isContinuous: false,
    hasUpcomingStream: false,
    onDeckLength: 0,
    upcomingLength: 0,
    streamArgs: null,
  })),
  isContinuousStream: jest.fn(() => false),
  stopContinuousStream: jest.fn(),
}));

describe('streamStatus and stopStream controllers (unit)', () => {
  function makeRes() {
    const res: any = {};
    res._status = 200;
    res._body = null;
    res.status = (code: number) => {
      res._status = code;
      return res;
    };
    res.json = (obj: any) => {
      res._body = obj;
      return res;
    };
    return res;
  }

  describe('streamStatusHandler', () => {
    it('returns stream status when no stream is running', async () => {
      const req: any = {};
      const res = makeRes();

      await streamStatusHandler(req, res);

      expect(res._status).toBe(200);
      expect(res._body).toEqual({
        status: 'success',
        data: {
          streamActive: false,
          streamType: 'none',
          hasUpcomingMedia: false,
          onDeckCount: 0,
          upcomingCount: 0,
          currentStream: null,
        },
      });
    });

    it('returns stream status when continuous stream is running', async () => {
      const mockStreamManager = require('../../src/services/streamManager');
      mockStreamManager.getStreamStatus.mockReturnValueOnce({
        isContinuous: true,
        hasUpcomingStream: true,
        onDeckLength: 2,
        upcomingLength: 10,
        streamArgs: {
          title: 'Default',
          env: 'default',
          hasPassword: true,
        },
      });

      const req: any = {};
      const res = makeRes();

      await streamStatusHandler(req, res);

      expect(res._status).toBe(200);
      expect(res._body.data.streamActive).toBe(true);
      expect(res._body.data.streamType).toBe('continuous');
      expect(res._body.data.onDeckCount).toBe(2);
    });
  });

  describe('stopStreamHandler', () => {
    it('stops running continuous stream', async () => {
      const mockStreamManager = require('../../src/services/streamManager');
      mockStreamManager.isContinuousStream.mockReturnValueOnce(true);

      const req: any = {};
      const res = makeRes();

      await stopStreamHandler(req, res);

      expect(mockStreamManager.stopContinuousStream).toHaveBeenCalled();
      expect(res._status).toBe(200);
      expect(res._body).toEqual({
        status: 'success',
        message: 'Continuous stream stopped successfully',
      });
    });

    it('returns error when no stream is running', async () => {
      const mockStreamManager = require('../../src/services/streamManager');
      mockStreamManager.isContinuousStream.mockReturnValueOnce(false);

      const req: any = {};
      const res = makeRes();

      await stopStreamHandler(req, res);

      expect(res._status).toBe(400);
      expect(res._body).toEqual({
        error: 'No continuous stream is currently running',
      });
    });
  });
});
