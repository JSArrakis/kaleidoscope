import {
  continuousStreamHandler,
  contStreamValidationRules,
} from '../../src/controllers/streamControllers';

// Mock express-validator to make validationResult controllable and body a no-op
jest.mock('express-validator', () => {
  // Return a chainable middleware-like object. Each chain method returns the
  // same function so calls like body(...).optional().isArray().custom(...) work
  const makeChain = () => {
    const fn: any = (req: any, res: any, next: any) => next();
    const chainMethods = [
      'optional',
      'isArray',
      'isString',
      'custom',
      'withMessage',
    ];
    chainMethods.forEach(m => {
      fn[m] = () => fn;
    });
    return fn;
  };

  return {
    validationResult: () => ({ isEmpty: () => true, array: () => [] }),
    body: (/* field */) => makeChain(),
  };
});

// Mock services used by the controller to avoid side effects
jest.mock('../../src/services/vlcClient', () => ({
  createVLCClient: async (password: string) => ({
    next: async () => {},
    addToPlaylist: async (p: string) => {},
  }),
}));

jest.mock('../../src/services/backgroundService', () => ({
  setVLCClient: jest.fn(),
  playVLC: jest.fn(async () => {}),
}));

jest.mock('../../src/services/streamManager', () => ({
  setContinuousStreamArgs: jest.fn(),
  getContinuousStreamArgs: jest.fn(() => ({ Password: 'testpass' })),
  initializeStream: jest.fn(() => ''),
  initializeOnDeckStream: jest.fn(),
  addInitialMediaBlocks: jest.fn(async () => {}),
  isContinuousStream: jest.fn(() => false),
  setContinuousStream: jest.fn(),
}));

jest.mock('../../src/services/mediaService', () => ({
  getConfig: jest.fn(() => ({})),
  getMedia: jest.fn(() => ({})),
  getMosaics: jest.fn(() => []),
  getStreamType: jest.fn(() => ({})),
  setStreamType: jest.fn(),
}));

describe('continuousStreamController (unit)', () => {
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

  it('accepts only password and starts the stream', async () => {
    const req: any = { body: { password: 'testpass' } };
    const res = makeRes();

    // Run the extra-fields middleware to ensure it passes
    await new Promise<void>(resolve =>
      (contStreamValidationRules[0] as any)(req, res, () => resolve()),
    );

    await continuousStreamHandler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual({ message: 'Stream Starting' });
  });

  it('rejects requests with extra fields', async () => {
    const req: any = { body: { password: 'x', movies: ['foo'] } };
    const res = makeRes();

    // Call the validation middleware which should write a 400
    let nextCalled = false;
    (contStreamValidationRules[0] as any)(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res._status).toBe(400);
    expect(res._body).toBeDefined();
  });

  it('rejects requests when continuous stream is already running', async () => {
    // Mock streamManager to return true for isContinuousStream
    const mockStreamManager = require('../../src/services/streamManager');
    mockStreamManager.isContinuousStream.mockReturnValueOnce(true);

    const req: any = { body: { password: 'testpass' } };
    const res = makeRes();

    await continuousStreamHandler(req, res);

    expect(res._status).toBe(409);
    expect(res._body).toEqual({
      error:
        'Continuous stream is already running. Stop the current stream before starting a new one.',
    });
  });

  it('demonstrates proper flag management - first request succeeds, second is blocked', async () => {
    const mockStreamManager = require('../../src/services/streamManager');

    // Reset all mocks for this test
    mockStreamManager.isContinuousStream.mockClear();
    mockStreamManager.setContinuousStream.mockClear();

    // First request should succeed (stream not running)
    mockStreamManager.isContinuousStream.mockReturnValueOnce(false);

    const req1: any = { body: { password: 'testpass' } };
    const res1 = makeRes();

    await continuousStreamHandler(req1, res1);

    expect(res1._status).toBe(200);
    expect(mockStreamManager.setContinuousStream).toHaveBeenCalledWith(true);

    // Second request should be blocked (stream now running)
    mockStreamManager.isContinuousStream.mockReturnValueOnce(true);

    const req2: any = { body: { password: 'testpass' } };
    const res2 = makeRes();

    await continuousStreamHandler(req2, res2);

    expect(res2._status).toBe(409);
    expect(res2._body.error).toContain('already running');
  });

  it('resets continuous flag when stream initialization fails', async () => {
    const mockStreamManager = require('../../src/services/streamManager');

    // Reset all mocks for this test
    mockStreamManager.isContinuousStream.mockClear();
    mockStreamManager.setContinuousStream.mockClear();
    mockStreamManager.initializeStream.mockClear();

    // Stream not running initially
    mockStreamManager.isContinuousStream.mockReturnValueOnce(false);
    // Make initializeStream return an error
    mockStreamManager.initializeStream.mockReturnValueOnce(
      'Failed to initialize',
    );

    const req: any = { body: { password: 'testpass' } };
    const res = makeRes();

    await continuousStreamHandler(req, res);

    expect(res._status).toBe(400);
    expect(res._body.message).toBe('Failed to initialize');
    // Verify the flag was set to true initially, then reset to false on error
    expect(mockStreamManager.setContinuousStream).toHaveBeenCalledWith(true);
    expect(mockStreamManager.setContinuousStream).toHaveBeenCalledWith(false);
  });
});
