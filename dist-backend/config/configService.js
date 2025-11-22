"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setConfig = setConfig;
exports.getConfig = getConfig;
// import { getDefaultEnvConfig } from '../db/envConfig.js';
// import { SetEnvConfig } from '../services/environmentManager.js';
let config;
function setConfig(value) {
    console.log('Setting config: ', value);
    config = value;
    console.log('Config set to: ', config);
}
function getConfig() {
    return config;
}
// export async function loadDefaultEnvConfig(
//   defaultPromo: string,
// ): Promise<void> {
//   const envConfig = await getDefaultEnvConfig(defaultPromo);
//   SetEnvConfig(envConfig);
// }
