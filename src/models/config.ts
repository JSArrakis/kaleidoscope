export class Config {
  dataFolder: string;
  interval: number;
  defaultCommercialFolder: string;
  defaultPromo: string;

  constructor(
    dataFolder: string,
    interval: number,
    defaultCommercialFolder: string,
    defaultPromo: string,
  ) {
    this.dataFolder = dataFolder;
    this.interval = interval;
    this.defaultCommercialFolder = defaultCommercialFolder;
    this.defaultPromo = defaultPromo;
  }

  static fromJsonObject(object: any): Config {
    return new Config(
      object.dataFolder,
      object.interval,
      object.defaultCommercialFolder,
      object.defaultPromo,
    );
  }
}
