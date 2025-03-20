import * as proEng from '../../src/services/proceduralEngine';
import * as proMan from '../../src/services/progressionManager';
import { ContStreamRequest } from '../../src/models/streamRequest';
import { Show } from '../../src/models/show';
import { StreamType } from '../../src/models/enum/streamTypes';
import * as tdProgression from '../testData/progression';
import * as tdShows from '../testData/shows';

describe('selectShowByDuration', () => {
  beforeEach(() => {
    proMan.SetLocalProgressionContextList(
      JSON.parse(JSON.stringify([tdProgression.continuousProgression])),
    );
  });

  const args = new ContStreamRequest(
    'securePassword',
    tdProgression.continuousProgression.title,
    tdProgression.continuousProgression.environment,
  );

  it('should return a show that is under the duration limit (result scenario 1)', () => {
    let shows: Show[] = [tdShows.reboot, tdShows.startrek, tdShows.farscape];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      1800,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.reboot);
    expect(numberOfEpisodes).toEqual(1);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 2)', () => {
    let shows: Show[] = [tdShows.reboot, tdShows.farscape, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      3600,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.farscape);
    expect(numberOfEpisodes).toEqual(1);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 3)', () => {
    let shows: Show[] = [tdShows.reboot, tdShows.farscape, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      7200,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.startrek);
    expect(numberOfEpisodes).toEqual(1);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 4)', () => {
    let shows: Show[] = [tdShows.reboot, tdShows.farscape, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      7200,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.reboot);
    expect(numberOfEpisodes).toEqual(2);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 5)', () => {
    let shows: Show[] = [
      tdShows.farscape,
      tdShows.reboot,
      tdShows.dragonballz,
      tdShows.startrek,
    ];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      7200,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.reboot);
    expect(numberOfEpisodes).toEqual(2);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 5)', () => {
    let shows: Show[] = [
      tdShows.farscape,
      tdShows.dragonballz,
      tdShows.reboot,
      tdShows.startrek,
    ];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      7200,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.dragonballz);
    expect(numberOfEpisodes).toEqual(2);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 6)', () => {
    let shows: Show[] = [tdShows.farscape, tdShows.tenchi, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      1800,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.tenchi);
    expect(numberOfEpisodes).toEqual(1);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 7)', () => {
    let shows: Show[] = [
      tdShows.farscape,
      tdShows.tenchi,
      tdShows.reboot,
      tdShows.startrek,
    ];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      3600,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.reboot);
    expect(numberOfEpisodes).toEqual(2);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 8)', () => {
    let shows: Show[] = [tdShows.farscape, tdShows.tenchi, tdShows.reboot];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    proMan.IncrementWatchRecord(
      tdProgression.continuousProgression.loadTitle,
      tdProgression.tenchiWatchRecord.mediaItemId,
      3,
      tdShows.tenchi,
    );
    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      3600,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.tenchi);
    expect(numberOfEpisodes).toEqual(1);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 8)', () => {
    let shows: Show[] = [tdShows.farscape, tdShows.batman];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);
    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      3600,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.batman);
    expect(numberOfEpisodes).toEqual(2);
    randomSpy.mockRestore();
  });

  it('should return a show that is under the duration limit (result scenario 9)', () => {
    let shows: Show[] = [tdShows.farscape, tdShows.batman];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);
    proMan.IncrementWatchRecord(
      tdProgression.continuousProgression.loadTitle,
      tdProgression.batmanWatchRecord.mediaItemId,
      4,
      tdShows.batman,
    );
    let [selectedShow, numberOfEpisodes] = proEng.selectShowByDuration(
      args,
      3600,
      shows,
      StreamType.Cont,
    );

    expect(selectedShow).toEqual(tdShows.batman);
    expect(numberOfEpisodes).toEqual(2);
    randomSpy.mockRestore();
  });
});
