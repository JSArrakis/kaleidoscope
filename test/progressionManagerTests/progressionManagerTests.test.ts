import { StreamType } from '../../src/models/enum/streamTypes';
import {
  ProgressionContext,
  WatchRecord,
} from '../../src/models/progressionContext';
import * as proMan from '../../src/services/progressionManager';
import { ContStreamRequest } from '../../src/models/streamRequest';
import * as tdProgression from '../testData/progression';
import * as tdShows from '../testData/shows';

describe('Progression Manager Tests', () => {
  describe('GetProgressionContext', () => {
    beforeEach(() => {
      proMan.SetLocalProgressionContextList(
        JSON.parse(JSON.stringify([tdProgression.continuousProgression])),
      );
    });

    it('should return a new progression context if one does not exist', () => {
      let progressionContext = proMan.GetProgressionContext(
        'Test',
        'test',
        'test',
        StreamType.Cont,
      );

      let expectedProgressionContext = new ProgressionContext(
        'Test',
        'test',
        'test',
        StreamType.Cont,
        [],
      );

      expect(progressionContext).toEqual(expectedProgressionContext);
    });

    it('should return an existing progression context if one exists', () => {
      let mediaProgression = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );

      expect(mediaProgression).toEqual(tdProgression.continuousProgression);
    });
  });

  describe('GetEpisodeDurLimit', () => {
    it('should return 0 if the episode is not found', () => {
      let durationLimit = proMan.GetEpisodeDurLimit(tdShows.sailor, 6);

      expect(durationLimit).toEqual(0);
    });

    it('should return the correct duration limit for the episode requested (scenario 1)', () => {
      let durationLimit = proMan.GetEpisodeDurLimit(tdShows.sailor, 1);

      expect(durationLimit).toEqual(1800);
    });

    it('should return the correct duration limit for the episode requested (scenario 2)', () => {
      let durationLimit = proMan.GetEpisodeDurLimit(tdShows.sailor, 3);

      expect(durationLimit).toEqual(1800);
    });

    it('should return the correct duration limit for the episode requested (scenario 2)', () => {
      let durationLimit = proMan.GetEpisodeDurLimit(tdShows.startrek, 1);

      expect(durationLimit).toEqual(7200);
    });
  });

  describe('GetShowListWatchRecords', () => {
    const args = new ContStreamRequest(
      'securePassword',
      tdProgression.continuousProgression.title,
      tdProgression.continuousProgression.environment,
    );

    beforeEach(() => {
      proMan.SetLocalProgressionContextList(
        JSON.parse(JSON.stringify([tdProgression.continuousProgression])),
      );
    });

    it('should return a list of watch records for the show list (scenario 1)', () => {
      let watchRecords = proMan.GetShowListWatchRecords(
        args,
        [
          tdShows.sailor,
          tdShows.reboot,
          tdShows.gundam,
          tdShows.tenchi,
          tdShows.batman,
          tdShows.startrek,
        ],
        StreamType.Cont,
      );

      expect(watchRecords).toEqual([
        tdProgression.sailorWatchRecord,
        tdProgression.rebootWatchRecord,
        tdProgression.gundamWatchRecord,
        tdProgression.tenchiWatchRecord,
        tdProgression.batmanWatchRecord,
        tdProgression.startrekWatchRecord,
      ]);
    });

    it('should return a list of watch records for the show list (scenario 2)', () => {
      let watchRecords = proMan.GetShowListWatchRecords(
        args,
        [tdShows.startrek, tdShows.sailor],
        StreamType.Cont,
      );

      expect(watchRecords).toEqual([
        tdProgression.startrekWatchRecord,
        tdProgression.sailorWatchRecord,
      ]);
    });

    it('should return a list of watch records for the show list (scenario 3)', () => {
      const dragonballzWatchRecord = new WatchRecord(
        'Dragon Ball Z',
        'dragonballz',
        0,
        0,
        1800,
      );
      let watchRecords = proMan.GetShowListWatchRecords(
        args,
        [tdShows.dragonballz, tdShows.gundam],
        StreamType.Cont,
      );

      expect(watchRecords).toEqual([
        dragonballzWatchRecord,
        tdProgression.gundamWatchRecord,
      ]);
    });
  });

  describe('GetWatchRecord', () => {
    beforeEach(() => {
      proMan.SetLocalProgressionContextList(
        JSON.parse(JSON.stringify([tdProgression.continuousProgression])),
      );
    });

    it('should return a new watch record if one does not exist', () => {
      let watchRecord = proMan.GetWatchRecord(
        tdProgression.continuousProgression,
        tdShows.dragonballz,
      );
      let expectedWatchRecord = new WatchRecord(
        tdShows.dragonballz.title,
        tdShows.dragonballz.mediaItemId,
        0,
        0,
        1800,
      );

      expect(watchRecord).toEqual(expectedWatchRecord);
    });

    it('should return an existing watch record if one exists', () => {
      let watchRecord = proMan.GetWatchRecord(
        tdProgression.continuousProgression,
        tdShows.sailor,
      );

      expect(watchRecord).toEqual(tdProgression.sailorWatchRecord);
    });
  });

  describe('IncrementWatchRecord', () => {
    beforeEach(() => {
      proMan.SetLocalProgressionContextList(
        JSON.parse(JSON.stringify([tdProgression.continuousProgression])),
      );
    });
    it('should increment the watch record episode by 1', () => {
      proMan.IncrementWatchRecord(
        tdProgression.continuousProgression.loadTitle,
        tdProgression.sailorWatchRecord.mediaItemId,
        1,
        tdShows.sailor,
      );
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.sailor);

      expect(watchRecord.episode).toEqual(1);
    });
  });

  describe('GetEpisodeNumbers', () => {
    beforeEach(() => {
      proMan.SetLocalProgressionContextList(
        JSON.parse(JSON.stringify([tdProgression.continuousProgression])),
      );
    });

    it('should return the first episode for a show that has not been watched before with one episode requested', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.sailor);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.sailor,
        watchRecord,
        1,
      );
      expect(episodes).toEqual([1]);
    });

    it('should return the correct number of episodes for a show that has not been watched (scenario 1)', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.sailor);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.sailor,
        watchRecord,
        3,
      );

      expect(episodes).toEqual([1, 2, 3]);
    });

    it('should return the correct number of episodes for a show that has not been watched (scenario 2)', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.sailor);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.sailor,
        watchRecord,
        6,
      );

      expect(episodes).toEqual([1, 2, 3, 4, 5, 1]);
    });

    it('should return the correct number of episodes for a show that has not been watched (scenario 3)', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.sailor);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.sailor,
        watchRecord,
        12,
      );

      expect(episodes).toEqual([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2]);
    });

    it('should return one episode for a show that has been watched before with one episode requested', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.reboot);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.reboot,
        watchRecord,
        1,
      );

      expect(episodes).toEqual([2]);
    });

    it('should return the correct number of episodes for a show that has been watched (scenario 1)', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.reboot);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.reboot,
        watchRecord,
        2,
      );

      expect(episodes).toEqual([2, 3]);
    });

    it('should return the correct number of episodes for a show that has been watched (scenario 2)', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.reboot);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.reboot,
        watchRecord,
        12,
      );

      expect(episodes).toEqual([2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3]);
    });

    it('should return the correct number of episodes for a show that has been watched completely (scenario 1)', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.batman);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.batman,
        watchRecord,
        1,
      );

      expect(episodes).toEqual([1]);
    });

    it('should return the correct number of episodes for a show that has been watched completely (scenario 2)', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.batman);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.batman,
        watchRecord,
        3,
      );

      expect(episodes).toEqual([1, 2, 3]);
    });

    it('should return the correct number of episodes for a show that has been watched completely (scenario 3)', () => {
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        StreamType.Cont,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.batman);
      let episodes = proMan.GetEpisodeNumbers(
        contProg.loadTitle,
        tdShows.batman,
        watchRecord,
        12,
      );

      expect(episodes).toEqual([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2]);
    });
  });

  describe('ManageShowProgression', () => {
    const contStreamRequest = new ContStreamRequest(
      'securePassword',
      tdProgression.continuousProgression.title,
      tdProgression.continuousProgression.environment,
    );

    beforeEach(() => {
      proMan.SetLocalProgressionContextList(
        JSON.parse(JSON.stringify([tdProgression.continuousProgression])),
      );
    });

    it('should increment correct watch record episode by the number request (scenario 1)', () => {
      let episodeNumbers = proMan.ManageShowProgression(
        tdShows.sailor,
        1,
        contStreamRequest,
        StreamType.Cont,
      );
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        tdProgression.continuousProgression.type,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.sailor);
      let expectedWatchRecord = new WatchRecord(
        tdShows.sailor.title,
        tdShows.sailor.mediaItemId,
        1,
        0,
        1800,
      );

      expect(watchRecord).toEqual(expectedWatchRecord);
      expect(episodeNumbers).toEqual([1]);
    });

    it('should increment correct watch record episode by the number request (scenario 2)', () => {
      let episodeNumbers = proMan.ManageShowProgression(
        tdShows.sailor,
        12,
        contStreamRequest,
        StreamType.Cont,
      );
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        tdProgression.continuousProgression.type,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.sailor);
      let expectedWatchRecord = new WatchRecord(
        tdShows.sailor.title,
        tdShows.sailor.mediaItemId,
        2,
        0,
        1800,
      );

      expect(watchRecord).toEqual(expectedWatchRecord);
      expect(episodeNumbers).toEqual([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2]);
    });

    it('should increment correct watch record episode by the number request (scenario 3)', () => {
      let episodeNumbers = proMan.ManageShowProgression(
        tdShows.reboot,
        1,
        contStreamRequest,
        StreamType.Cont,
      );
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        tdProgression.continuousProgression.type,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.reboot);
      let expectedWatchRecord = new WatchRecord(
        tdShows.reboot.title,
        tdShows.reboot.mediaItemId,
        2,
        0,
        1800,
      );

      expect(watchRecord).toEqual(expectedWatchRecord);
      expect(episodeNumbers).toEqual([2]);
    });

    it('should increment correct watch record episode by the number request (scenario 4)', () => {
      let episodeNumbers = proMan.ManageShowProgression(
        tdShows.reboot,
        12,
        contStreamRequest,
        StreamType.Cont,
      );
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        tdProgression.continuousProgression.type,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.reboot);
      let expectedWatchRecord = new WatchRecord(
        tdShows.reboot.title,
        tdShows.reboot.mediaItemId,
        3,
        0,
        1800,
      );

      expect(watchRecord).toEqual(expectedWatchRecord);
      expect(episodeNumbers).toEqual([2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3]);
    });

    it('should increment correct watch record episode by the number request (scenario 5)', () => {
      let episodeNumbers = proMan.ManageShowProgression(
        tdShows.batman,
        1,
        contStreamRequest,
        StreamType.Cont,
      );
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        tdProgression.continuousProgression.type,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.batman);
      let expectedWatchRecord = new WatchRecord(
        tdShows.batman.title,
        tdShows.batman.mediaItemId,
        1,
        0,
        1800,
      );

      expect(watchRecord).toEqual(expectedWatchRecord);
      expect(episodeNumbers).toEqual([1]);
    });

    it('should increment correct watch record episode by the number request (scenario 6)', () => {
      let episodeNumbers = proMan.ManageShowProgression(
        tdShows.batman,
        12,
        contStreamRequest,
        StreamType.Cont,
      );
      let contProg = proMan.GetProgressionContext(
        tdProgression.continuousProgression.title,
        tdProgression.continuousProgression.loadTitle,
        tdProgression.continuousProgression.environment,
        tdProgression.continuousProgression.type,
      );
      let watchRecord = proMan.GetWatchRecord(contProg, tdShows.batman);
      let expectedWatchRecord = new WatchRecord(
        tdShows.batman.title,
        tdShows.batman.mediaItemId,
        2,
        0,
        1800,
      );

      expect(watchRecord).toEqual(expectedWatchRecord);
      expect(episodeNumbers).toEqual([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2]);
    });
  });
});
