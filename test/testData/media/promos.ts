import { createPromo } from "../../../factories/promo.factory";

export const promo1 = createPromo(
  "Promo 1",
  "promo1",
  15,
  "/path/promo1.mp4",
  MediaType.Promo,
  []
);

export const defaultPromo = createPromo(
  "Default Promo",
  "defaultpromo",
  15,
  "/path/defaultpromo.mp4",
  MediaType.Promo,
  []
);

export const promos = [promo1, defaultPromo];
