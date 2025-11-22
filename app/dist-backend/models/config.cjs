"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
class Config {
    constructor(dataFolder, interval, defaultCommercialFolder, defaultPromo) {
        this.dataFolder = dataFolder;
        this.interval = interval;
        this.defaultCommercialFolder = defaultCommercialFolder;
        this.defaultPromo = defaultPromo;
    }
    static fromJsonObject(object) {
        return new Config(object.dataFolder, object.interval, object.defaultCommercialFolder, object.defaultPromo);
    }
}
exports.Config = Config;
