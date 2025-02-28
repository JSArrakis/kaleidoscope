import { Commercial } from '../../src/models/commercial';
import * as buffEng from '../../src/services/bufferEngine';
import * as tdCommercials from '../testData/commercials';

describe('selectCommercials', () => {
  it('select commericals until duration or block duration is filled (scenario 1)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.92);
    const commercials: Commercial[] = [];
    const defaultCommercials: Commercial[] = [];
    const usedCommercials: Commercial[] = [];
    const duration: number = 0;

    const expectedCommercials: Commercial[] = [];
    const expectedRemainingDuration: number = 0;

    const [result, remainingDuration] = buffEng.selectCommercials(
      commercials,
      defaultCommercials,
      usedCommercials,
      duration,
    );

    expect(result).toEqual(expectedCommercials);
    expect(remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
  it('select commericals until duration or block duration is filled (scenario 2)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.92);
    const commercials: Commercial[] = [
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.transformers80s1,
      tdCommercials.alientrailer1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.meninblacktoys97,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
      tdCommercials.jurassicpark3toys,
      tdCommercials.halloween711,
      tdCommercials.americanwerewolfinlondontrailer1,
      tdCommercials.beetlejuicetrailer1,
      tdCommercials.ocarinaoftimetrailer1,
    ];
    const defaultCommercials: Commercial[] = [
      tdCommercials.default1,
      tdCommercials.default2,
      tdCommercials.default3,
      tdCommercials.default4,
      tdCommercials.default5,
      tdCommercials.default6,
      tdCommercials.default7,
      tdCommercials.default8,
      tdCommercials.default9,
    ];
    const usedCommercials: Commercial[] = [];
    const duration: number = 0;

    const expectedCommercials: Commercial[] = [];
    const expectedRemainingDuration: number = 0;

    const [result, remainingDuration] = buffEng.selectCommercials(
      commercials,
      defaultCommercials,
      usedCommercials,
      duration,
    );

    expect(result).toEqual(expectedCommercials);
    expect(remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
  it('select commericals until duration or block duration is filled (scenario 3)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.62);
    const commercials: Commercial[] = [
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.transformers80s1,
      tdCommercials.alientrailer1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.meninblacktoys97,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
      tdCommercials.jurassicpark3toys,
      tdCommercials.halloween711,
      tdCommercials.americanwerewolfinlondontrailer1,
      tdCommercials.beetlejuicetrailer1,
      tdCommercials.ocarinaoftimetrailer1,
    ];
    const defaultCommercials: Commercial[] = [
      tdCommercials.default1,
      tdCommercials.default2,
      tdCommercials.default3,
      tdCommercials.default4,
      tdCommercials.default5,
      tdCommercials.default6,
      tdCommercials.default7,
      tdCommercials.default8,
      tdCommercials.default9,
    ];
    const usedCommercials: Commercial[] = [];
    const duration: number = 500;

    const expectedCommercials: Commercial[] = [
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
      tdCommercials.jurassicpark3toys,
    ];
    const expectedRemainingDuration: number = 380;

    const [result, remainingDuration] = buffEng.selectCommercials(
      commercials,
      defaultCommercials,
      usedCommercials,
      duration,
    );

    expect(result).toEqual(expectedCommercials);
    expect(remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
  it('select commericals until duration or block duration is filled (scenario 3)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.62);
    const commercials: Commercial[] = [
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.transformers80s1,
      tdCommercials.alientrailer1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.meninblacktoys97,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
      tdCommercials.jurassicpark3toys,
      tdCommercials.halloween711,
      tdCommercials.americanwerewolfinlondontrailer1,
      tdCommercials.beetlejuicetrailer1,
      tdCommercials.ocarinaoftimetrailer1,
    ];
    const defaultCommercials: Commercial[] = [
      tdCommercials.default1,
      tdCommercials.default2,
      tdCommercials.default3,
      tdCommercials.default4,
      tdCommercials.default5,
      tdCommercials.default6,
      tdCommercials.default7,
      tdCommercials.default8,
      tdCommercials.default9,
    ];
    const usedCommercials: Commercial[] = [];
    const duration: number = 30;

    const expectedCommercials: Commercial[] = [tdCommercials.jurassicpark3toys];
    const expectedRemainingDuration: number = 0;

    const [result, remainingDuration] = buffEng.selectCommercials(
      commercials,
      defaultCommercials,
      usedCommercials,
      duration,
    );

    expect(result).toEqual(expectedCommercials);
    expect(remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
  it('select commericals until duration or block duration is filled (scenario 3)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.62);
    const commercials: Commercial[] = [
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.transformers80s1,
      tdCommercials.alientrailer1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.meninblacktoys97,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
      tdCommercials.jurassicpark3toys,
      tdCommercials.halloween711,
      tdCommercials.americanwerewolfinlondontrailer1,
      tdCommercials.beetlejuicetrailer1,
      tdCommercials.ocarinaoftimetrailer1,
    ];
    const defaultCommercials: Commercial[] = [
      tdCommercials.default1,
      tdCommercials.default2,
      tdCommercials.default3,
      tdCommercials.default4,
      tdCommercials.default5,
      tdCommercials.default6,
      tdCommercials.default7,
      tdCommercials.default8,
      tdCommercials.default9,
    ];
    const usedCommercials: Commercial[] = [];
    const duration: number = 62;

    const expectedCommercials: Commercial[] = [
      tdCommercials.ocarinaoftimetrailer1,
    ];
    const expectedRemainingDuration: number = 0;

    const [result, remainingDuration] = buffEng.selectCommercials(
      commercials,
      defaultCommercials,
      usedCommercials,
      duration,
    );

    expect(result).toEqual(expectedCommercials);
    expect(remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
});
