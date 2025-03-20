import { Commercial } from '../models/commercial';

export function checkBufferViability(commercialList: Commercial[]): boolean {
  let isViable = false;
  let durationLimitsList = [15, 16, 17, 18, 19, 20, 30];

  durationLimitsList.forEach(durationLimit => {
    let commercial = commercialList.find(c => c.duration === durationLimit);
    if (commercial) {
      isViable = true;
    } else {
      isViable = false;
      return isViable;
    }
  });

  return isViable;
}
