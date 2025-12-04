// Mock Electron app module
import { jest } from "@jest/globals";

jest.mock("electron", () => ({
  app: {
    getPath: jest.fn((type) => {
      if (type === "userData") {
        return "/tmp/test-kaleidoscope";
      }
      return "/tmp";
    }),
  },
}));

// Mock better-sqlite3
jest.mock("better-sqlite3", () => {
  return jest.fn().mockImplementation(() => ({
    prepare: jest.fn().mockReturnValue({
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
    }),
    exec: jest.fn(),
    transaction: jest.fn((fn) => fn),
  }));
});
