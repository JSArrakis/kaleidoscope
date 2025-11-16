import moment from 'moment';
import { findNextCadenceTime } from '../../src/utils/common';

describe('findNextCadenceTime', () => {
  it('should return next :30 mark when current time has minutes < 30', () => {
    // Test case: 2:15 PM should return 2:30 PM
    const currentTime = moment('2025-01-01 14:15:00').unix();
    const expectedTime = moment('2025-01-01 14:30:00').unix();

    const result = findNextCadenceTime(currentTime);

    expect(result).toBe(expectedTime);
  });

  it('should return same time when at exact :00 mark', () => {
    // Test case: 2:00:00 PM should return 2:00:00 PM (already at cadence)
    const currentTime = moment('2025-01-01 14:00:00').unix();
    const expectedTime = moment('2025-01-01 14:00:00').unix();

    const result = findNextCadenceTime(currentTime);

    expect(result).toBe(expectedTime);
  });

  it('should return next :00 mark when current time has minutes >= 30', () => {
    // Test case: 2:45 PM should return 3:00 PM
    const currentTime = moment('2025-01-01 14:45:00').unix();
    const expectedTime = moment('2025-01-01 15:00:00').unix();

    const result = findNextCadenceTime(currentTime);

    expect(result).toBe(expectedTime);
  });

  it('should return same time when at exact :30 mark', () => {
    // Test case: 2:30:00 PM should return 2:30:00 PM (already at cadence)
    const currentTime = moment('2025-01-01 14:30:00').unix();
    const expectedTime = moment('2025-01-01 14:30:00').unix();

    const result = findNextCadenceTime(currentTime);

    expect(result).toBe(expectedTime);
  });

  it('should find next cadence when close but not exact', () => {
    // Test case: 2:00:01 PM (1 second past) should return 2:30:00 PM
    const currentTime = moment('2025-01-01 14:00:01').unix();
    const expectedTime = moment('2025-01-01 14:30:00').unix();

    const result = findNextCadenceTime(currentTime);

    expect(result).toBe(expectedTime);
  });
});
