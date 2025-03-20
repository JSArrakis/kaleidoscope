import * as proEng from '../../src/services/proceduralEngine';
import * as proMan from '../../src/services/progressionManager';
import { ContStreamRequest } from '../../src/models/streamRequest';
import { StreamType } from '../../src/models/enum/streamTypes';
import { Show } from '../../src/models/show';
import * as tdShows from '../testData/shows';
import * as tdProgression from '../testData/progression';

describe('getEpisodesUnderDuration', () => {
  beforeEach(() => {
    proMan.SetLocalProgressionContextList(
      JSON.parse(JSON.stringify([tdProgression.continuousProgression])),
    );
  });

  const args = new ContStreamRequest(
    'securePassword',
    tdProgression.continuousProgression.title,
    tdProgression.continuousProgression.environment,
    [],
    ['scifi', 'action'],
  );

  it('should return an array of episodes that are under the duration limit (result scenario 1)', () => {
    let shows: Show[] = [tdShows.reboot, tdShows.farscape, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

    let [episodes, showTitle] = proEng.getEpisodesUnderDuration(
      args,
      shows,
      1800,
      StreamType.Cont,
    );

    expect(episodes).toEqual([tdShows.reboot.episodes[1]]);
    expect(showTitle).toEqual(tdShows.reboot.title);
    randomSpy.mockRestore();
  });

  it('should return an array of episodes that are under the duration limit (result scenario 2)', () => {
    let shows: Show[] = [tdShows.reboot, tdShows.farscape, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

    let [episodes, showTitle] = proEng.getEpisodesUnderDuration(
      args,
      shows,
      3600,
      StreamType.Cont,
    );

    expect(episodes).toEqual([
      tdShows.reboot.episodes[1],
      tdShows.reboot.episodes[2],
    ]);
    expect(showTitle).toEqual(tdShows.reboot.title);
    randomSpy.mockRestore();
  });

  it('should return an array of episodes that are under the duration limit (result scenario 3)', () => {
    let shows: Show[] = [tdShows.batman, tdShows.farscape, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

    let [episodes, showTitle] = proEng.getEpisodesUnderDuration(
      args,
      shows,
      3600,
      StreamType.Cont,
    );

    expect(episodes).toEqual([
      tdShows.batman.episodes[0],
      tdShows.batman.episodes[1],
    ]);
    expect(showTitle).toEqual(tdShows.batman.title);
    randomSpy.mockRestore();
  });

  it('should return an array of episodes that are under the duration limit (result scenario 4)', () => {
    let shows: Show[] = [tdShows.batman, tdShows.farscape, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);
    proMan.IncrementWatchRecord(
      tdProgression.continuousProgression.loadTitle,
      tdProgression.batmanWatchRecord.mediaItemId,
      4,
      tdShows.batman,
    );

    let [episodes, showTitle] = proEng.getEpisodesUnderDuration(
      args,
      shows,
      3600,
      StreamType.Cont,
    );

    expect(episodes).toEqual([
      tdShows.batman.episodes[4],
      tdShows.batman.episodes[0],
    ]);
    expect(showTitle).toEqual(tdShows.batman.title);
    randomSpy.mockRestore();
  });

  it('should return an array of episodes that are under the duration limit (result scenario 5)', () => {
    let shows: Show[] = [tdShows.reboot, tdShows.farscape, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

    let [episodes, showTitle] = proEng.getEpisodesUnderDuration(
      args,
      shows,
      3600,
      StreamType.Cont,
    );

    expect(episodes).toEqual([tdShows.farscape.episodes[0]]);
    expect(showTitle).toEqual(tdShows.farscape.title);
    randomSpy.mockRestore();
  });

  it('should return an array of episodes that are under the duration limit (result scenario 6)', () => {
    let shows: Show[] = [tdShows.reboot, tdShows.farscape, tdShows.startrek];
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

    let [episodes, showTitle] = proEng.getEpisodesUnderDuration(
      args,
      shows,
      7200,
      StreamType.Cont,
    );

    expect(episodes).toEqual([tdShows.startrek.episodes[0]]);
    expect(showTitle).toEqual(tdShows.startrek.title);
    randomSpy.mockRestore();
  });
});
