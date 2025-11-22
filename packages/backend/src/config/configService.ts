import { Config } from '../models/config.js';
// import { getDefaultEnvConfig } from '../db/envConfig.js';
// import { SetEnvConfig } from '../services/environmentManager.js';

let config: Config;

export function setConfig(value: Config): void {
  console.log('Setting config: ', value);
  config = value;
  console.log('Config set to: ', config);
}

export function getConfig(): Config {
  return config;
}

// export async function loadDefaultEnvConfig(
//   defaultPromo: string,
// ): Promise<void> {
//   const envConfig = await getDefaultEnvConfig(defaultPromo);
//   SetEnvConfig(envConfig);
// }
