"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db/db");
const backgroundService_1 = require("./services/backgroundService");
const config_1 = require("./models/config");
const conf = __importStar(require("./config/configService"));
// mediaService preload no longer required with SQLite; queries will be used on-demand
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const streamRoutes_1 = __importDefault(require("./routes/streamRoutes"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Define __dirname for CommonJS (it's available globally in CommonJS)
// const __filename = undefined;  // Not needed
// const __dirname = undefined;  // Not needed - available as global
const isDev = () => process.env.NODE_ENV === 'development';
// Define the path to the config file
const configFilePath = path.join(__dirname, isDev() ? '../../config.json' : '../config.json');
// Read and parse the config file
const rawConfigData = fs.readFileSync(configFilePath, 'utf-8');
const configData = JSON.parse(rawConfigData);
// TODO - Validate the config data
const config = config_1.Config.fromJsonObject(configData);
// Gets the config from the config.json file and sets it in the stream service
conf.setConfig(config);
// Loads media from the SQLite database
(0, db_1.connectToDB)().then(() => {
    // We are connected to the SQLite DB; start the server and background tasks.
    const app = (0, express_1.default)();
    const port = process.env.PORT || 3001;
    app.use(express_1.default.json());
    // Health check endpoint
    app.get('/api/v1/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    app.use('/api/admin/v1', adminRoutes_1.default);
    app.use('/api/v1', streamRoutes_1.default);
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    // Sets the end of day marker as 30 minutes before midnight on the day the service is started
    (0, backgroundService_1.setEndOfDayMarker)();
    // Sets the unix timestamp for the start of the next day at midnight
    (0, backgroundService_1.setTomorrow)();
    // The cycle check is a function that runs every 5 minutes to check if the stream should progress to the next media block
    (0, backgroundService_1.cycleCheck)();
});
