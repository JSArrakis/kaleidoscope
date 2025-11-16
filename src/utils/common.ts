import moment from 'moment';

// Now is a unix timestamp in seconds
export function findNextCadenceTime(now: number): number {
  const nowMoment = moment.unix(now);
  const minutes = nowMoment.minute();
  const seconds = nowMoment.second();

  // If we're already at a cadence time (exactly :00 or :30 with 0 seconds), return current time
  if (seconds === 0 && (minutes === 0 || minutes === 30)) {
    return now;
  }

  // Otherwise, find the next cadence time
  const targetMinute = minutes < 30 ? 30 : 60;
  const nextMark = nowMoment
    .clone()
    .minute(targetMinute === 60 ? 0 : 30)
    .second(0);
  if (targetMinute === 60) {
    nextMark.add(1, 'hour');
  }
  return nextMark.unix();
}
