import { Promo } from '../models/promo';
import { promoRepository } from '../repositories/promoRepository';

let promos: Promo[] = [];

/**
 * Load all promos from the database
 */
export async function loadPromos(): Promise<void> {
  promos = promoRepository.findAll() as Promo[];

  if (!promos || promos.length === 0) {
    console.log('No Promos Found');
    promos = [];
    return;
  }

  console.log(promos.length + ' Promos loaded');
}

/**
 * Get all loaded promos
 */
export function getAllPromos(): Promo[] {
  return promos;
}

/**
 * Select a random promo that fits within the given duration
 * @param maxDuration Maximum duration the promo can be
 * @returns A random promo that fits, or null if none available
 */
export function selectRandomPromo(maxDuration: number): Promo | null {
  if (promos.length === 0) {
    console.warn('[Promo Service] No promos available');
    return null;
  }

  // Filter promos that fit within the duration
  const fittingPromos = promos.filter(promo => promo.duration <= maxDuration);

  if (fittingPromos.length === 0) {
    // If no promos fit exactly, just select any random promo
    // The buffer system will handle duration corrections
    console.warn(
      `[Promo Service] No promos fit within ${maxDuration}s, selecting random promo anyway`,
    );
    return promos[Math.floor(Math.random() * promos.length)];
  }

  // Select a random promo from those that fit
  const selectedPromo =
    fittingPromos[Math.floor(Math.random() * fittingPromos.length)];

  console.log(
    `[Promo Service] Selected promo "${selectedPromo.title}" (${selectedPromo.duration}s) from ${fittingPromos.length} available`,
  );

  return selectedPromo;
}

/**
 * Get the count of available promos
 */
export function getPromoCount(): number {
  return promos.length;
}

/**
 * Check if any promos are available
 */
export function hasPromos(): boolean {
  return promos.length > 0;
}

/**
 * Initialize the promo service - call this on app startup
 */
export async function initializePromoService(): Promise<void> {
  await loadPromos();
}
