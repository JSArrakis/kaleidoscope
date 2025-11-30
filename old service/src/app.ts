import express from 'express';
import { connectToDB } from './db/db';
import {
  cycleCheck,
  setEndOfDayMarker,
  setTomorrow,
} from './services/backgroundService';
import { Config } from './models/config';
import * as conf from './config/configService';
// mediaService preload no longer required with SQLite; queries will be used on-demand
import adminRoutes from './routes/adminRoutes';
import streamRoutes from './routes/streamRoutes';
import * as fs from 'fs';
import * as path from 'path';

// Define the path to the config file
const configFilePath = path.join(__dirname, '../config.json');

// Read and parse the config file
const rawConfigData = fs.readFileSync(configFilePath, 'utf-8');
const configData = JSON.parse(rawConfigData);
// TODO - Validate the config data
const config = Config.fromJsonObject(configData);

// Gets the config from the config.json file and sets it in the stream service
conf.setConfig(config);

// Loads media from the SQLite database
connectToDB().then(() => {
  // We are connected to the SQLite DB; start the server and background tasks.
  const app = express();
  const port = process.env.PORT || 3001;

  app.use(express.json());

  app.use('/api/admin/v1', adminRoutes);
  app.use('/api/v1', streamRoutes);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  // Sets the end of day marker as 30 minutes before midnight on the day the service is started
  setEndOfDayMarker();

  // Sets the unix timestamp for the start of the next day at midnight
  setTomorrow();

  // The cycle check is a function that runs every 5 minutes to check if the stream should progress to the next media block
  cycleCheck();
});
