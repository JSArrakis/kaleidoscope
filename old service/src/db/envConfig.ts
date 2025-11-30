import { EnvConfiguration } from '../models/envConfiguration';

// NOTE: This module previously used a DB model (EnvConfigurationModel).
// For test runs and the current refactor where env-by-request is removed,
// provide lightweight in-memory/stub implementations that return default
// EnvConfiguration objects. Replace with real DB-backed implementations
// when adding environment configuration persistence.

export async function getDefaultEnvConfig(
  defaultPromo: string,
): Promise<EnvConfiguration> {
  return new EnvConfiguration('Default', 'default', [], [], [], defaultPromo);
}

export async function getEnvConfig(
  loadTitle: string,
): Promise<[EnvConfiguration, string]> {
  // Return a default env configuration for now. Real DB lookup will be
  // implemented as part of the environment configuration feature.
  if (!loadTitle || loadTitle === 'default') {
    return [new EnvConfiguration('Default', 'default', [], [], [], ''), ''];
  }
  return [
    new EnvConfiguration('', '', [], [], [], ''),
    'Specified Environment Configuration does not exist, please create it through the admin panel or use the default configuration.',
  ];
}

export async function loadEnvConfigList(): Promise<EnvConfiguration[]> {
  // No persistent env configs exist in the current refactor. Return empty list.
  return [];
}
