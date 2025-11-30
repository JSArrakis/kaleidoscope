import { Config } from '../models/config';
import { getDefaultEnvConfig } from '../db/envConfig';
import { SetEnvConfig } from '../services/environmentManager';

let config: Config;

export function setConfig(value: Config): void {
  console.log('Setting config: ', value);
  config = value;
  console.log('Config set to: ', config);
}

export function getConfig(): Config {
  return config;
}

export async function loadDefaultEnvConfig(
  defaultPromo: string,
): Promise<void> {
  const envConfig = await getDefaultEnvConfig(defaultPromo);
  SetEnvConfig(envConfig);
}
