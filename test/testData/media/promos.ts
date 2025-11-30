import { MediaType, Promo } from "../../../types/index.js";

export const promo1 = new Promo(
  "Promo 1",
  "promo1",
  15,
  "/path/promo1.mp4",
  MediaType.Promo,
  []
);

export const defaultPromo = new Promo(
  "Default Promo",
  "defaultpromo",
  15,
  "/path/defaultpromo.mp4",
  MediaType.Promo,
  []
);

export const promos = [promo1, defaultPromo];
