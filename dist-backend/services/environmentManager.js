"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadEnvConfigList = LoadEnvConfigList;
exports.SetEnvConfig = SetEnvConfig;
exports.GetEnvConfig = GetEnvConfig;
let environmentConfiguration;
let environmentConfigList;
function LoadEnvConfigList(envConfigList) {
    environmentConfigList = envConfigList;
}
function SetEnvConfig(config) {
    environmentConfiguration = config;
}
function GetEnvConfig() {
    return environmentConfiguration;
}
