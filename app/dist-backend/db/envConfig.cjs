"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultEnvConfig = getDefaultEnvConfig;
exports.getEnvConfig = getEnvConfig;
exports.loadEnvConfigList = loadEnvConfigList;
const envConfiguration_1 = require("../models/envConfiguration.cjs");
// NOTE: This module previously used a DB model (EnvConfigurationModel).
// For test runs and the current refactor where env-by-request is removed,
// provide lightweight in-memory/stub implementations that return default
// EnvConfiguration objects. Replace with real DB-backed implementations
// when adding environment configuration persistence.
async function getDefaultEnvConfig(defaultPromo) {
    return new envConfiguration_1.EnvConfiguration('Default', 'default', [], [], [], defaultPromo);
}
async function getEnvConfig(loadTitle) {
    // Return a default env configuration for now. Real DB lookup will be
    // implemented as part of the environment configuration feature.
    if (!loadTitle || loadTitle === 'default') {
        return [new envConfiguration_1.EnvConfiguration('Default', 'default', [], [], [], ''), ''];
    }
    return [
        new envConfiguration_1.EnvConfiguration('', '', [], [], [], ''),
        'Specified Environment Configuration does not exist, please create it through the admin panel or use the default configuration.',
    ];
}
async function loadEnvConfigList() {
    // No persistent env configs exist in the current refactor. Return empty list.
    return [];
}
