import {
  EnvConfigurationModel,
  EnvConfiguration,
} from '../models/envConfiguration';

export async function getDefaultEnvConfig(
  defaultPromo: string,
): Promise<EnvConfiguration> {
  const defaultEnvConfig = await EnvConfigurationModel.findOne({
    mediaItemId: 'default',
  });
  if (defaultEnvConfig) {
    console.log('Default Env Configuration already exists');
    return defaultEnvConfig;
  }

  const envConfig = new EnvConfigurationModel({
    Title: 'Default',
    LoadTitle: 'default',
    Favorites: [],
    BlackList: [],
    DefaultPromo: defaultPromo,
  });

  await envConfig.save();
  console.log('Default Env Configuration Created');
  return envConfig;
}

export async function getEnvConfig(
  loadTitle: string,
): Promise<[EnvConfiguration, string]> {
  const envConfig = await EnvConfigurationModel.findOne({
    mediaItemId: loadTitle,
  });
  if (!envConfig) {
    console.log('Env Configuration does not exist');
    return [
      new EnvConfiguration('', '', [], [], [], ''),
      'Specified Environment Configuration does not exist, please create it through the admin panel or use the default configuration.',
    ];
  }
  console.log('Env Configuration Found');
  return [envConfig, ''];
}

export async function loadEnvConfigList(): Promise<EnvConfiguration[]> {
  const envConfigs = await EnvConfigurationModel.find();
  if (!envConfigs || envConfigs.length === 0) {
    console.log('No Env Configurations Found');
    return [];
  }
  console.log(envConfigs.length + ' Env Configurations loaded');
  return envConfigs;
}
