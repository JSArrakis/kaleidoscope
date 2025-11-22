import { EnvConfiguration } from '../models/envConfiguration';

let environmentConfiguration: EnvConfiguration;
let environmentConfigList: EnvConfiguration[];

export function LoadEnvConfigList(envConfigList: EnvConfiguration[]) {
  environmentConfigList = envConfigList;
}

export function SetEnvConfig(config: EnvConfiguration) {
  environmentConfiguration = config;
}

export function GetEnvConfig(): EnvConfiguration {
  return environmentConfiguration;
}
