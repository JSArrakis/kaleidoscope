import { MediaType } from '../../src/models/enum/mediaTypes';
import { Promo } from '../../src/models/promo';

export const env1promo = new Promo(
  'Enviornment 1 Promo',
  'env1promo',
  15,
  '/path/env1promo.mp4',
  MediaType.Promo,
  ['env1'],
);

export const defaultPromo = new Promo(
  'Default Promo',
  'defaultpromo',
  15,
  '/path/env1promo.mp4',
  MediaType.Promo,
  ['default'],
);

export const promos = [env1promo];
export const defaultPromos = [defaultPromo];
