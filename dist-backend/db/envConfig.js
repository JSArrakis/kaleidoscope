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
exports.getDefaultEnvConfig = getDefaultEnvConfig;
exports.getEnvConfig = getEnvConfig;
exports.loadEnvConfigList = loadEnvConfigList;
const envConfiguration_1 = require("../models/envConfiguration");
// NOTE: This module previously used a DB model (EnvConfigurationModel).
// For test runs and the current refactor where env-by-request is removed,
// provide lightweight in-memory/stub implementations that return default
// EnvConfiguration objects. Replace with real DB-backed implementations
// when adding environment configuration persistence.
function getDefaultEnvConfig(defaultPromo) {
    return __awaiter(this, void 0, void 0, function* () {
        return new envConfiguration_1.EnvConfiguration('Default', 'default', [], [], [], defaultPromo);
    });
}
function getEnvConfig(loadTitle) {
    return __awaiter(this, void 0, void 0, function* () {
        // Return a default env configuration for now. Real DB lookup will be
        // implemented as part of the environment configuration feature.
        if (!loadTitle || loadTitle === 'default') {
            return [new envConfiguration_1.EnvConfiguration('Default', 'default', [], [], [], ''), ''];
        }
        return [
            new envConfiguration_1.EnvConfiguration('', '', [], [], [], ''),
            'Specified Environment Configuration does not exist, please create it through the admin panel or use the default configuration.',
        ];
    });
}
function loadEnvConfigList() {
    return __awaiter(this, void 0, void 0, function* () {
        // No persistent env configs exist in the current refactor. Return empty list.
        return [];
    });
}
