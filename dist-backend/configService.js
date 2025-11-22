"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setConfig = setConfig;
exports.getConfig = getConfig;
exports.loadDefaultEnvConfig = loadDefaultEnvConfig;
const envConfig_1 = require("../db/envConfig");
const environmentManager_1 = require("../services/environmentManager");
let config;
function setConfig(value) {
    console.log('Setting config: ', value);
    config = value;
    console.log('Config set to: ', config);
}
function getConfig() {
    return config;
}
function loadDefaultEnvConfig(defaultPromo) {
    return __awaiter(this, void 0, void 0, function* () {
        const envConfig = yield (0, envConfig_1.getDefaultEnvConfig)(defaultPromo);
        (0, environmentManager_1.SetEnvConfig)(envConfig);
    });
}
